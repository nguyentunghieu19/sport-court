package com.court.backend.service;

import com.court.backend.dto.request.CreatePaymentRequest;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.PaymentResponse;
import com.court.backend.dto.response.PaymentUrlResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.Notification;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.User;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.PaymentMethod;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.PaymentType;
import com.court.backend.enums.RefundStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.NotificationRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import com.court.backend.repository.UserRepository;
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
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String PROVIDER = "VNPAY";
    private static final int MAX_PAGE_SIZE = 50;

    // Kết quả xử lý: rspCode và message là phản hồi gửi lại cho VNPay (IPN); paid cho trang kết quả
    public record ProcessResult(String rspCode, String message, boolean paid, String bookingCode) {
    }

    @PersistenceContext
    private EntityManager entityManager;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RefundRepository refundRepository;
    private final NotificationRepository notificationRepository;
    private final VnpayService vnpayService;

    @Transactional
    public PaymentUrlResponse createVnpayPayment(Long userId, CreatePaymentRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }

        Booking booking = bookingRepository.findByIdAndUserId(request.bookingId(), userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn không ở trạng thái chờ thanh toán");
        }
        if (booking.getExpiresAt() == null || !booking.getExpiresAt().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn đã hết hạn thanh toán");
        }

        // Số tiền do backend quyết định, không nhận từ ứng dụng
        PaymentType type = request.paymentType();
        BigDecimal amount;
        if (type == PaymentType.DEPOSIT) {
            amount = booking.getDepositAmount();
        } else if (type == PaymentType.FULL) {
            amount = booking.getTotalAmount();
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hình thức thanh toán chỉ gồm DEPOSIT hoặc FULL");
        }
        if (amount.signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán không hợp lệ");
        }

        // Giao dịch cũ còn chờ của đơn này bị thay bằng giao dịch mới
        for (Payment old : paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.PENDING)) {
            old.setStatus(PaymentStatus.FAILED);
            old.setFailureReason("Đã thay bằng giao dịch mới");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaymentType(type);
        payment.setMethod(PaymentMethod.GATEWAY);
        payment.setProvider(PROVIDER);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);
        payment = paymentRepository.saveAndFlush(payment);

        String url = vnpayService.buildPaymentUrl(
                payment.getId(), booking.getBookingCode(), amount, ipAddress, booking.getExpiresAt());

        return new PaymentUrlResponse(
                payment.getId(), booking.getId(), booking.getBookingCode(),
                type.name(), amount, url, booking.getExpiresAt());
    }

    // Dùng chung cho Return URL và IPN: kiểm tra chữ ký, số tiền, rồi cập nhật giao dịch và đơn
    @Transactional
    public ProcessResult processVnpayResult(Map<String, String> params) {
        if (!vnpayService.verifySignature(params)) {
            return new ProcessResult("97", "Invalid signature", false, null);
        }

        Long paymentId = parseLong(params.get("vnp_TxnRef"));
        Payment payment = paymentId == null ? null : paymentRepository.findById(paymentId).orElse(null);
        if (payment == null || !PROVIDER.equals(payment.getProvider())) {
            return new ProcessResult("01", "Order not found", false, null);
        }

        // Khóa dòng giao dịch và đọc lại trạng thái mới nhất để Return và IPN không xử lý chồng nhau
        entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);

        BigDecimal reportedAmount;
        try {
            reportedAmount = new BigDecimal(params.get("vnp_Amount")).movePointLeft(2);
        } catch (RuntimeException e) {
            return new ProcessResult("04", "Invalid amount", false, null);
        }
        if (reportedAmount.compareTo(payment.getAmount()) != 0) {
            return new ProcessResult("04", "Invalid amount", false, null);
        }

        Booking booking = bookingRepository.findById(payment.getBooking().getId()).orElseThrow();
        String bookingCode = booking.getBookingCode();

        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            return new ProcessResult("02", "Order already confirmed", true, bookingCode);
        }

        boolean gatewaySuccess = "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));

        if (!gatewaySuccess) {
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("VNPAY mã phản hồi " + params.get("vnp_ResponseCode"));
                paymentRepository.saveAndFlush(payment);
            }
            return new ProcessResult("00", "Confirm Success", false, bookingCode);
        }

        // Thanh toán thành công
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setPaidAt(Instant.now());
        payment.setProviderTransactionId(params.get("vnp_TransactionNo"));
        payment.setFailureReason(null);
        paymentRepository.saveAndFlush(payment);

        // Khóa dòng đơn đặt và đọc lại, tránh ghi đè lên thay đổi đồng thời (ví dụ bộ quét hết hạn)
        entityManager.refresh(booking, LockModeType.PESSIMISTIC_WRITE);

        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setExpiresAt(null);
            bookingRepository.saveAndFlush(booking);
            notifyPaymentSuccess(booking, payment);
        } else if (booking.getStatus() != BookingStatus.CONFIRMED
                || paymentRepository.existsByBookingIdAndStatusAndIdNot(
                booking.getId(), PaymentStatus.SUCCEEDED, payment.getId())) {
            // Tiền về nhưng đơn đã bị hủy, hoặc đơn đã được thanh toán bởi giao dịch khác: tạo yêu cầu hoàn tiền
            String reason = booking.getStatus() == BookingStatus.CONFIRMED
                    ? "Thanh toán trùng cho đơn đã được xác nhận"
                    : "Thanh toán đến sau khi đơn đã bị hủy hoặc hết hạn";
            createRefundRequest(payment, reason);
        }

        return new ProcessResult("00", "Confirm Success", true, bookingCode);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getMine(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndBookingUserId(paymentId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch"));
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> listMine(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<Payment> result = paymentRepository.findByBookingUserId(userId, pageable);
        return PageResponse.from(result.map(PaymentResponse::from));
    }

    private void notifyPaymentSuccess(Booking booking, Payment payment) {
        Notification notification = new Notification();
        notification.setUser(booking.getUser());
        notification.setBooking(booking);
        notification.setTitle("Thanh toán thành công");
        notification.setMessage("Đơn " + booking.getBookingCode() + " đã được xác nhận. Số tiền đã thanh toán: "
                + payment.getAmount().toBigInteger() + " đ");
        notificationRepository.save(notification);
    }

    private void createRefundRequest(Payment payment, String reason) {
        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setAmount(payment.getAmount());
        refund.setReason(reason);
        refund.setStatus(RefundStatus.PENDING);
        refundRepository.save(refund);
    }

    private Long parseLong(String value) {
        try {
            return value == null ? null : Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}