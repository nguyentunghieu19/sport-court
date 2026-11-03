package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record CancellationPreviewResponse(
        Long bookingId,
        String bookingCode,
        String status,
        boolean canCancel,
        Instant cancelDeadlineAt,
        BigDecimal paidAmount,
        BigDecimal refundAmount,
        BigDecimal forfeitedAmount,
        String message
) {
}