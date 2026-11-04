package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.response.BookingResponse;
import com.court.backend.dto.response.ManagerBookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.RefundStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerBookingService {

    private static final int MAX_PAGE_SIZE = 50;
    // Các trạng thái giao dịch mà tiền đã thu thành công
    private static final List<PaymentStatus> COLLECTED_STATUSES =
            List.of(PaymentStatus.SUCCEEDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final ManagerAccessService managerAccessService;

    @Transactional(readOnly = true)
    public PageResponse<ManagerBookingResponse> list(Long managerId, Long venueId, Long fieldId, LocalDate date,
                                                     BookingStatus status, String keyword, int page, int size) {
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
                buildSpecification(venueIds, fieldId, date, status, keyword), pageable);

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
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        if (!managerAccessService.manageableVenueIds(manager).contains(booking.getField().getVenue().getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân");
        }
        return buildResponses(List.of(booking)).get(0);
    }

    // Chỉ thêm điều kiện lọc khi có giá trị
    private Specification<Booking> buildSpecification(List<Long> venueIds, Long fieldId, LocalDate date,
                                                      BookingStatus status, String keyword) {
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
        if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.COMPLETED) {
            outstanding = booking.getTotalAmount().subtract(paid.subtract(refunded)).max(BigDecimal.ZERO);
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
                booking.getCancelledBy() == null ? null : booking.getCancelledBy().getFullName());
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}