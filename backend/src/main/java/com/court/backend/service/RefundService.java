package com.court.backend.service;

import com.court.backend.dto.response.ManagerRefundResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.RefundResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.Notification;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.RefundStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.NotificationRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefundService {

    private static final int MAX_PAGE_SIZE = 50;

    @PersistenceContext
    private EntityManager entityManager;

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final ManagerAccessService managerAccessService;

    @Transactional(readOnly = true)
    public PageResponse<ManagerRefundResponse> listForManager(Long managerId, Long venueId,
                                                              RefundStatus status, int page, int size) {
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
                Sort.by(Sort.Direction.DESC, "requestedAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Refund> result = status == null
                ? refundRepository.findByPaymentBookingFieldVenueIdIn(venueIds, pageable)
                : refundRepository.findByPaymentBookingFieldVenueIdInAndStatus(venueIds, status, pageable);

        return PageResponse.from(result.map(this::toManagerResponse));
    }

    // Xác nhận đã hoàn tiền (việc chuyển tiền diễn ra ngoài hệ thống, ghi chú là dấu vết đối soát)
    @Transactional
    public ManagerRefundResponse confirm(Long managerId, Long refundId, String note) {
        User manager = managerAccessService.requireManager(managerId);
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền"));

        Venue venue = refund.getPayment().getBooking().getField().getVenue();
        if (!managerAccessService.manageableVenueIds(manager).contains(venue.getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền");
        }

        // Khóa dòng yêu cầu và đọc lại trạng thái mới nhất để không xác nhận hai lần
        entityManager.refresh(refund, LockModeType.PESSIMISTIC_WRITE);
        if (refund.getStatus() != RefundStatus.PENDING && refund.getStatus() != RefundStatus.PROCESSING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Yêu cầu hoàn tiền này đã được xử lý");
        }

        Payment payment = paymentRepository.findById(refund.getPayment().getId()).orElseThrow();
        entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);

        BigDecimal alreadyRefunded = refundRepository.findByPaymentIdIn(List.of(payment.getId())).stream()
                .filter(r -> r.getStatus() == RefundStatus.SUCCEEDED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refundedTotal = alreadyRefunded.add(refund.getAmount());
        if (refundedTotal.compareTo(payment.getAmount()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tổng tiền hoàn vượt quá số tiền khách đã thanh toán");
        }

        Instant now = Instant.now();
        refund.setStatus(RefundStatus.SUCCEEDED);
        refund.setProcessedBy(manager);
        refund.setProcessedAt(now);
        refund.setCompletedAt(now);
        refund.setBankTransferReference(note.trim());
        refund.setFailureReason(null);
        refundRepository.saveAndFlush(refund);

        payment.setStatus(refundedTotal.compareTo(payment.getAmount()) >= 0
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED);
        paymentRepository.saveAndFlush(payment);

        Booking booking = payment.getBooking();
        Notification notification = new Notification();
        notification.setUser(booking.getUser());
        notification.setBooking(booking);
        notification.setTitle("Đã hoàn tiền");
        notification.setMessage("Đơn " + booking.getBookingCode() + ": đã hoàn "
                + money(refund.getAmount()) + " cho bạn.");
        notificationRepository.save(notification);

        return toManagerResponse(refund);
    }

    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> listMine(Long userId, Long bookingId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "requestedAt").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<Refund> result = bookingId == null
                ? refundRepository.findByPaymentBookingUserId(userId, pageable)
                : refundRepository.findByPaymentBookingUserIdAndPaymentBookingId(userId, bookingId, pageable);
        return PageResponse.from(result.map(RefundResponse::from));
    }

    private ManagerRefundResponse toManagerResponse(Refund refund) {
        Payment payment = refund.getPayment();
        Booking booking = payment.getBooking();
        Venue venue = booking.getField().getVenue();
        User customer = booking.getUser();

        return new ManagerRefundResponse(
                refund.getId(),
                payment.getId(),
                payment.getPaymentType().name(),
                payment.getMethod().name(),
                booking.getId(),
                booking.getBookingCode(),
                venue.getId(),
                venue.getName(),
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                refund.getAmount(),
                refund.getReason(),
                refund.getStatus().name(),
                refund.getBankTransferReference(),
                refund.getRequestedAt(),
                refund.getRequestedBy() == null ? null : refund.getRequestedBy().getFullName(),
                refund.getProcessedAt(),
                refund.getCompletedAt(),
                refund.getProcessedBy() == null ? null : refund.getProcessedBy().getFullName());
    }

    private String money(BigDecimal amount) {
        return String.format("%,d", amount.longValue()).replace(',', '.') + " đ";
    }
}