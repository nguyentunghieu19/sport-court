package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentUrlResponse(
        Long paymentId,
        Long bookingId,
        String bookingCode,
        String paymentType,
        BigDecimal amount,
        String paymentUrl,
        Instant expiresAt
) {
}