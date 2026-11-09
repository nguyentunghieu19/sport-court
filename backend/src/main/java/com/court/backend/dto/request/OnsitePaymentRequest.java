package com.court.backend.dto.request;

import com.court.backend.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record OnsitePaymentRequest(
        @NotNull PaymentMethod method,
        @NotNull @Positive BigDecimal amount,
        @NotNull UUID idempotencyKey
) {
}
