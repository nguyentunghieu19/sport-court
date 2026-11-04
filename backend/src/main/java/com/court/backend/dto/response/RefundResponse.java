package com.court.backend.dto.response;

import com.court.backend.entity.Refund;

import java.math.BigDecimal;
import java.time.Instant;

public record RefundResponse(
        Long id,
        Long bookingId,
        String bookingCode,
        BigDecimal amount,
        String reason,
        String status,
        Instant requestedAt,
        Instant completedAt
) {

    public static RefundResponse from(Refund refund) {
        return new RefundResponse(
                refund.getId(),
                refund.getPayment().getBooking().getId(),
                refund.getPayment().getBooking().getBookingCode(),
                refund.getAmount(),
                refund.getReason(),
                refund.getStatus().name(),
                refund.getRequestedAt(),
                refund.getCompletedAt());
    }
}