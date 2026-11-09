package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.request.OnsitePaymentRequest;
import com.court.backend.dto.response.BookingResponse;
import com.court.backend.dto.response.ManagerBookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.PaymentResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.PaymentMethod;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.PaymentType;
import com.court.backend.enums.RefundStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerBookingService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int EARLY_CHECK_IN_MINUTES = 30;
    // Các trạng thái giao dịch mà tiền đã thu thành công
    private static final List<PaymentStatus> COLLECTED_STATUSES =
            List.of(PaymentStatus.SUCCEEDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED);
    private static final List<RefundStatus> DEDUCTED_REFUND_STATUSES =
            List.of(RefundStatus.SUCCEEDED, RefundStatus.PENDING, RefundStatus.PROCESSING);
    private static final List<BookingStatus> BALANCE_STATUSES =
            List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

    @PersistenceContext
    private EntityManager entityManager;

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final ManagerAccessService managerAccessService;

    @Transactional(readOnly = true)
    public PageResponse<ManagerBookingResponse> list(Long managerId, Long venueId, Long fieldId, LocalDate date,
                                                     BookingStatus status, String keyword, boolean outstandingOnly,
                                                     int page, int size) {
        User manager = managerAccessService.requireManager(managerId);
        List<Long> venueIds = managerAccessService.manageableVenueIds(manager);

        if (venueId != null) {
            if (!venueIds.contains(venueId)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm");
            }
            venueIds = List.of(venueId);
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        if (venueIds.isEmpty()) {
            return new PageResponse<>(List.of(), safePage, safeSize, 0, 0);
        }

        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "startAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Booking> result = bookingRepository.findAll(
                buildSpecification(venueIds, fieldId, date, status, keyword, outstandingOnly), pageable);

        return new PageResponse<>(
                buildResponses(result.getContent()),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ManagerBookingResponse get(Long managerId, Long bookingId) {
        User manager = managerAccessService.requireManager(managerId);
        Booking booking = findBooking(bookingId);
        requireAccess(manager, booking);
        return buildResponse(booking);
    }

    @Transactional
    public ManagerBookingResponse checkIn(Long managerId, Long bookingId) {
        User manager = managerAccessService.requireManager(managerId);
        return checkIn(manager, findBooking(bookingId));
    }

    @Transactional
    public ManagerBookingResponse checkInByCode(Long managerId, String bookingCode) {
        User manager = managerAccessService.requireManager(managerId);
        Booking booking = bookingRepository.findByBookingCode(bookingCode.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));
        return checkIn(manager, booking);
    }

    private ManagerBookingResponse checkIn(User manager, Booking booking) {
        lockBooking(manager, booking);
        if (booking.getCheckedInAt() != null) {
            return buildResponse(booking);
        }

        Instant now = Instant.now();
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ ghi nhận khách đến cho đơn đã xác nhận");
        }
        if (now.isBefore(booking.getStartAt().minus(EARLY_CHECK_IN_MINUTES, ChronoUnit.MINUTES))
                || !now.isBefore(booking.getEndAt())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chỉ ghi nhận khách đến từ 30 phút trước giờ bắt đầu đến trước giờ kết thúc");
        }
        booking.setCheckedInAt(now);
        booking.setCheckedInBy(manager);
        return buildResponse(booking);
    }

    @Transactional
    public ManagerBookingResponse complete(Long managerId, Long bookingId) {
        return finish(managerId, bookingId, BookingStatus.COMPLETED);
    }

    @Transactional
    public ManagerBookingResponse noShow(Long managerId, Long bookingId) {
        return finish(managerId, bookingId, BookingStatus.NO_SHOW);
    }

    private ManagerBookingResponse finish(Long managerId, Long bookingId, BookingStatus target) {
        User manager = managerAccessService.requireManager(managerId);
        Booking booking = findBooking(bookingId);
        lockBooking(manager, booking);
        if (booking.getStatus() == target) {
            return buildResponse(booking);
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED || Instant.now().isBefore(booking.getEndAt())) {
            throw new ApiException(HttpStatus.CONFLICT, "Thao tác này cần đơn đã xác nhận và đã hết giờ chơi");
        }
        if (target == BookingStatus.COMPLETED && booking.getCheckedInAt() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Cần ghi nhận khách đến trước khi hoàn thành đơn");
        }
        if (target == BookingStatus.NO_SHOW && booking.getCheckedInAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn đã ghi nhận khách đến");
        }
        booking.setStatus(target);
        return buildResponse(booking);
    }

    @Transactional
    public PaymentResponse recordOnsitePayment(Long managerId, Long bookingId, OnsitePaymentRequest request) {
        User manager = managerAccessService.requireManager(managerId);
        Booking booking = findBooking(bookingId);
        lockBooking(manager, booking);
        if (request.method() != PaymentMethod.CASH && request.method() != PaymentMethod.BANK_TRANSFER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ tiền mặt hoặc chuyển khoản tại sân");
        }

        String key = "onsite:" + bookingId + ":" + request.idempotencyKey();
        Payment previous = paymentRepository.findByBookingIdAndIdempotencyKey(bookingId, key).orElse(null);
        if (previous != null) {
            if (previous.getMethod() != request.method() || previous.getAmount().compareTo(request.amount()) != 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Mã yêu cầu đã được dùng cho giao dịch khác");
            }
            return PaymentResponse.from(previous);
        }

        if (booking.getStatus() != BookingStatus.COMPLETED
                && (booking.getStatus() != BookingStatus.CONFIRMED || booking.getCheckedInAt() == null)) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ thu tiền cho đơn đã ghi nhận khách đến hoặc đã hoàn thành");
        }
        BigDecimal outstanding = buildResponse(booking).outstandingAmount();
        if (outstanding.signum() == 0 || outstanding.compareTo(request.amount()) != 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Số tiền còn phải thu đã thay đổi, vui lòng tải lại đơn");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaymentType(PaymentType.REMAINING);
        payment.setMethod(request.method());
        payment.setAmount(outstanding);
        payment.setIdempotencyKey(key);
        payment.setReceivedBy(manager);
        payment.setPaidAt(Instant.now());
        payment.setStatus(PaymentStatus.SUCCEEDED);
        return PaymentResponse.from(paymentRepository.saveAndFlush(payment));
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));
    }

    private void requireAccess(User manager, Booking booking) {
        if (!managerAccessService.manageableVenueIds(manager).contains(booking.getField().getVenue().getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân");
        }
    }

    private void lockBooking(User manager, Booking booking) {
        requireAccess(manager, booking);
        // Các thao tác tại sân chỉ khóa đơn, không lấy thêm khóa ghi trên payments.
        entityManager.refresh(booking, LockModeType.PESSIMISTIC_WRITE);
    }

    private ManagerBookingResponse buildResponse(Booking booking) {
        return buildResponses(List.of(booking)).get(0);
    }

    // Chỉ thêm điều kiện lọc khi có giá trị
    private Specification<Booking> buildSpecification(List<Long> venueIds, Long fieldId, LocalDate date,
                                                      BookingStatus status, String keyword, boolean outstandingOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Booking, SportsField> field = root.join("field");
            predicates.add(field.get("venue").get("id").in(venueIds));

            if (fieldId != null) {
                predicates.add(cb.equal(field.get("id"), fieldId));
            }
            if (date != null) {
                Instant from = date.atStartOfDay(AppTime.ZONE).toInstant();
                Instant to = date.plusDays(1).atStartOfDay(AppTime.ZONE).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.<Instant>get("startAt"), from));
                predicates.add(cb.lessThan(root.<Instant>get("startAt"), to));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (outstandingOnly) {
                predicates.add(root.get("status").in(BALANCE_STATUSES));
                predicates.add(hasOutstandingBalance(root, query, cb));
            }
            if (keyword != null && !keyword.isBlank()) {
                Join<Booking, User> customer = root.join("user");
                String pattern = "%" + escapeLike(keyword.trim().toLowerCase()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("bookingCode")), pattern, '\\'),
                        cb.like(cb.lower(customer.<String>get("fullName")), pattern, '\\'),
                        cb.like(cb.lower(customer.<String>get("phone")), pattern, '\\')));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Predicate hasOutstandingBalance(Root<Booking> booking, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Subquery<BigDecimal> collected = query.subquery(BigDecimal.class);
        Root<Payment> payment = collected.from(Payment.class);
        collected.select(cb.coalesce(cb.sum(payment.<BigDecimal>get("amount")), BigDecimal.ZERO))
                .where(cb.equal(payment.get("booking"), booking),
                        payment.get("status").in(COLLECTED_STATUSES));

        Subquery<BigDecimal> deducted = query.subquery(BigDecimal.class);
        Root<Refund> refund = deducted.from(Refund.class);
        Join<Refund, Payment> refundedPayment = refund.join("payment");
        deducted.select(cb.coalesce(cb.sum(refund.<BigDecimal>get("amount")), BigDecimal.ZERO))
                .where(cb.equal(refundedPayment.get("booking"), booking),
                        refundedPayment.get("status").in(COLLECTED_STATUSES),
                        refund.get("status").in(DEDUCTED_REFUND_STATUSES));

        return cb.greaterThan(booking.<BigDecimal>get("totalAmount"), cb.diff(collected, deducted));
    }

    // Tính tiền đã thu, đã hoàn, đang chờ hoàn cho cả danh sách bằng vài truy vấn gộp, tránh truy vấn từng đơn
    private List<ManagerBookingResponse> buildResponses(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }

        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        Map<Long, List<Payment>> paymentsByBooking = paymentRepository
                .findByBookingIdInAndStatusIn(bookingIds, COLLECTED_STATUSES).stream()
                .collect(Collectors.groupingBy(payment -> payment.getBooking().getId()));

        List<Long> paymentIds = paymentsByBooking.values().stream()
                .flatMap(List::stream)
                .map(Payment::getId)
                .toList();
        Map<Long, List<Refund>> refundsByPayment = paymentIds.isEmpty()
                ? Map.of()
                : refundRepository.findByPaymentIdIn(paymentIds).stream()
                .collect(Collectors.groupingBy(refund -> refund.getPayment().getId()));

        return bookings.stream()
                .map(booking -> toResponse(booking,
                        paymentsByBooking.getOrDefault(booking.getId(), List.of()), refundsByPayment))
                .toList();
    }

    private ManagerBookingResponse toResponse(Booking booking, List<Payment> payments,
                                              Map<Long, List<Refund>> refundsByPayment) {
        BigDecimal paid = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;
        BigDecimal pendingRefund = BigDecimal.ZERO;

        for (Payment payment : payments) {
            paid = paid.add(payment.getAmount());
            for (Refund refund : refundsByPayment.getOrDefault(payment.getId(), List.of())) {
                if (refund.getStatus() == RefundStatus.SUCCEEDED) {
                    refunded = refunded.add(refund.getAmount());
                } else if (refund.getStatus() == RefundStatus.PENDING
                        || refund.getStatus() == RefundStatus.PROCESSING) {
                    pendingRefund = pendingRefund.add(refund.getAmount());
                }
            }
        }

        BigDecimal outstanding = BigDecimal.ZERO;
        if (BALANCE_STATUSES.contains(booking.getStatus())) {
            // Tiền đang chờ hoàn không được dùng để bù vào phần khách còn phải trả.
            outstanding = booking.getTotalAmount().subtract(paid).add(refunded).add(pendingRefund)
                    .max(BigDecimal.ZERO);
        }

        User customer = booking.getUser();
        return new ManagerBookingResponse(
                BookingResponse.from(booking),
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                paid,
                refunded,
                pendingRefund,
                outstanding,
                booking.getCancelledBy() == null ? null : booking.getCancelledBy().getFullName(),
                booking.getCheckedInAt(),
                booking.getCheckedInBy() == null ? null : booking.getCheckedInBy().getFullName());
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
