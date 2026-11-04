package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ManagerRefundResponse(
        Long id,
        Long paymentId,
        String paymentType,
        String paymentMethod,
        Long bookingId,
        String bookingCode,
        Long venueId,
        String venueName,
        Long customerId,
        String customerName,
        String customerPhone,
        String customerEmail,
        BigDecimal amount,
        String reason,
        String status,
        String referenceNote,
        Instant requestedAt,
        String requestedByName,
        Instant processedAt,
        Instant completedAt,
        String processedByName
) {
}