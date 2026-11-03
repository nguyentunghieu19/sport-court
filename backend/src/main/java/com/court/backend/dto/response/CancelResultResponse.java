package com.court.backend.dto.response;

import java.math.BigDecimal;

public record CancelResultResponse(
        BookingResponse booking,
        BigDecimal paidAmount,
        BigDecimal refundAmount,
        BigDecimal forfeitedAmount,
        String message
) {
}