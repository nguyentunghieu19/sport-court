package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.response.BookingResponse;
import com.court.backend.dto.response.CancelResultResponse;
import com.court.backend.dto.response.CancellationPreviewResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.BookingPolicy;
import com.court.backend.entity.Notification;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.User;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.PaymentType;
import com.court.backend.enums.RefundStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingPolicyRepository;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.NotificationRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CancellationService {

    private static final int DEFAULT_CANCELLATION_DEADLINE_HOURS = 24;
    private static final DateTimeFormatter DISPLAY_TIME =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(AppTime.ZONE);

    // Điều khoản hủy áp dụng cho một đơn
    private record Terms(int deadlineHours, boolean depositRefundable, boolean fullPaymentRefundable) {
    }

    // Kết quả đánh giá việc hủy: refundByPayment cho biết mỗi giao dịch được hoàn bao nhiêu
    private record Evaluation(boolean canCancel, Instant deadline, BigDecimal paid, BigDecimal refund,
                              Map<Long, BigDecimal> refundByPayment, String message) {
    }

    @PersistenceContext
    private EntityManager entityManager;

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final NotificationRepository notificationRepository;
    private final BookingPolicyRepository bookingPolicyRepository;

    @Transactional(readOnly = true)
    public CancellationPreviewResponse preview(Long userId, Long bookingId) {
        Booking booking = findOwnBooking(userId, bookingId);
        List<Payment> succeeded = paymentRepository
                .findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCEEDED);
        Evaluation evaluation = evaluate(booking, succeeded, Instant.now());

        return new CancellationPreviewResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getStatus().name(),
                evaluation.canCancel(),
                evaluation.deadline(),
                evaluation.paid(),
                evaluation.refund(),
                evaluation.paid().subtract(evaluation.refund()),
                evaluation.message());
    }

    @Transactional
    public CancelResultResponse cancelByCustomer(Long userId, Long bookingId, String reason) {
        Booking booking = findOwnBooking(userId, bookingId);

        // Khóa các giao dịch rồi mới khóa đơn, cùng thứ tự với PaymentService để không khóa chéo nhau
        List<Payment> payments = paymentRepository.findByBookingIdOrderByIdAsc(booking.getId());
        for (Payment payment : payments) {
            entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);
        }
        entityManager.refresh(booking, LockModeType.PESSIMISTIC_WRITE);

        List<Payment> succeeded = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCEEDED)
                .toList();
        Instant now = Instant.now();
        Evaluation evaluation = evaluate(booking, succeeded, now);
        if (!evaluation.canCancel()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, evaluation.message());
        }

        User customer = booking.getUser();
        String cleanReason = reason == null || reason.isBlank()
                ? "Khách hủy đơn"
                : "Khách hủy đơn: " + reason.trim();

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(now);
        booking.setCancelledBy(customer);
        booking.setCancellationReason(cleanReason);

        // Giao dịch còn đang chờ của đơn bị hủy; nếu khách vẫn trả sau đó, PaymentService sẽ tự tạo yêu cầu hoàn tiền
        for (Payment payment : payments) {
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Đơn đã bị hủy");
            }
        }

        for (Payment payment : succeeded) {
            BigDecimal refundAmount = evaluation.refundByPayment().get(payment.getId());
            if (refundAmount != null && refundAmount.signum() > 0) {
                createRefundRequest(payment, customer, refundAmount, cleanReason);
            }
        }
        bookingRepository.saveAndFlush(booking);

        BigDecimal forfeited = evaluation.paid().subtract(evaluation.refund());
        notifyAfterCustomerCancel(booking, customer, evaluation);

        String message = "Đã hủy đơn " + booking.getBookingCode() + ".";
        if (evaluation.refund().signum() > 0) {
            message += " Chủ sân sẽ liên hệ để hoàn " + money(evaluation.refund()) + " cho bạn.";
        } else if (evaluation.paid().signum() > 0) {
            message += " Theo chính sách, bạn không được hoàn lại số tiền đã thanh toán.";
        }
        return new CancelResultResponse(
                BookingResponse.from(booking), evaluation.paid(), evaluation.refund(), forfeited, message);
    }

    private Booking findOwnBooking(Long userId, Long bookingId) {
        return bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));
    }

    private Evaluation evaluate(Booking booking, List<Payment> succeeded, Instant now) {
        BigDecimal paid = succeeded.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Terms terms = resolveTerms(booking);
        Instant deadline = booking.getStartAt().minus(terms.deadlineHours(), ChronoUnit.HOURS);

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            return deny(deadline, paid, "Đơn không thể hủy ở trạng thái hiện tại");
        }
        if (!booking.getStartAt().isAfter(now)) {
            return deny(deadline, paid, "Đơn đã đến giờ chơi, không thể hủy");
        }
        if (paid.signum() == 0) {
            return new Evaluation(true, deadline, paid, BigDecimal.ZERO, Map.of(),
                    "Đơn chưa thanh toán nên hủy không mất phí.");
        }
        if (now.isAfter(deadline)) {
            return deny(deadline, paid, "Đã quá hạn hủy (hạn hủy: " + DISPLAY_TIME.format(deadline)
                    + "). Đơn đã thanh toán không thể hủy sau thời điểm này");
        }

        Map<Long, BigDecimal> refundByPayment = new HashMap<>();
        BigDecimal refund = BigDecimal.ZERO;
        for (Payment payment : succeeded) {
            boolean refundable = payment.getPaymentType() == PaymentType.DEPOSIT
                    ? terms.depositRefundable()
                    : terms.fullPaymentRefundable();
            if (refundable) {
                refundByPayment.put(payment.getId(), payment.getAmount());
                refund = refund.add(payment.getAmount());
            }
        }

        String message;
        if (refund.compareTo(paid) == 0) {
            message = "Nếu hủy, bạn sẽ được hoàn " + money(refund)
                    + ". Chủ sân sẽ liên hệ qua số điện thoại để hoàn tiền.";
        } else if (refund.signum() == 0) {
            message = "Theo chính sách, nếu hủy bạn sẽ không được hoàn lại " + money(paid) + " đã thanh toán.";
        } else {
            message = "Nếu hủy, bạn sẽ được hoàn " + money(refund) + " trên tổng " + money(paid)
                    + " đã thanh toán (phần còn lại không được hoàn). Chủ sân sẽ liên hệ qua số điện thoại để hoàn tiền.";
        }
        return new Evaluation(true, deadline, paid, refund, refundByPayment, message);
    }

    private Evaluation deny(Instant deadline, BigDecimal paid, String message) {
        return new Evaluation(false, deadline, paid, BigDecimal.ZERO, Map.of(), message);
    }

    // Ưu tiên chính sách lưu trong đơn; đơn cũ chưa có thì dùng chính sách hiện hành của địa điểm
    private Terms resolveTerms(Booking booking) {
        if (booking.getPolicyCancellationDeadlineHours() != null
                && booking.getPolicyDepositRefundable() != null
                && booking.getPolicyFullPaymentRefundable() != null) {
            return new Terms(booking.getPolicyCancellationDeadlineHours(),
                    booking.getPolicyDepositRefundable(), booking.getPolicyFullPaymentRefundable());
        }
        Optional<BookingPolicy> policy = bookingPolicyRepository
                .findByVenueId(booking.getField().getVenue().getId());
        return policy
                .map(p -> new Terms(p.getCancellationDeadlineHours(),
                        p.isDepositRefundableOnCustomerCancel(), p.isFullPaymentRefundableBeforeDeadline()))
                .orElse(new Terms(DEFAULT_CANCELLATION_DEADLINE_HOURS, false, true));
    }

    private void createRefundRequest(Payment payment, User requestedBy, BigDecimal amount, String reason) {
        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setRequestedBy(requestedBy);
        refund.setAmount(amount);
        refund.setReason(reason);
        refund.setStatus(RefundStatus.PENDING);
        refundRepository.save(refund);
    }

    private void notifyAfterCustomerCancel(Booking booking, User customer, Evaluation evaluation) {
        String customerMessage = "Bạn đã hủy đơn " + booking.getBookingCode() + ".";
        if (evaluation.refund().signum() > 0) {
            customerMessage += " Chủ sân sẽ liên hệ qua số điện thoại để hoàn " + money(evaluation.refund()) + ".";
        } else if (evaluation.paid().signum() > 0) {
            customerMessage += " Theo chính sách, số tiền đã thanh toán không được hoàn lại.";
        }
        saveNotification(customer, booking, "Đã hủy đơn đặt sân", customerMessage);

        // Báo cho chủ sân khi có tiền cần hoàn để kịp liên hệ khách
        if (evaluation.refund().signum() > 0) {
            User owner = booking.getField().getVenue().getOwner();
            String contact = customer.getPhone() != null ? customer.getPhone() : customer.getEmail();
            saveNotification(owner, booking, "Khách hủy đơn, cần hoàn tiền",
                    "Khách " + customer.getFullName() + " (" + contact + ") đã hủy đơn "
                            + booking.getBookingCode() + ". Cần hoàn " + money(evaluation.refund())
                            + ": hãy liên hệ khách để hoàn tiền rồi xác nhận trên hệ thống.");
        }
    }

    private void saveNotification(User user, Booking booking, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setBooking(booking);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    private String money(BigDecimal amount) {
        return String.format("%,d", amount.longValue()).replace(',', '.') + " đ";
    }
}