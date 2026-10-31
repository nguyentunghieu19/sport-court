package com.court.backend.dto.response;

import com.court.backend.entity.Payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long bookingId,
        String bookingCode,
        String bookingStatus,
        String paymentType,
        String method,
        String provider,
        String providerTransactionId,
        BigDecimal amount,
        String status,
        Instant paidAt,
        String failureReason,
        Instant createdAt
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getBooking().getBookingCode(),
                payment.getBooking().getStatus().name(),
                payment.getPaymentType().name(),
                payment.getMethod().name(),
                payment.getProvider(),
                payment.getProviderTransactionId(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getPaidAt(),
                payment.getFailureReason(),
                payment.getCreatedAt());
    }
}