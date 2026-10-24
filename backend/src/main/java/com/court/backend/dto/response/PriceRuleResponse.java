package com.court.backend.dto.response;

import com.court.backend.entity.FieldPriceRule;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;

public record PriceRuleResponse(
        Long id,
        Long fieldId,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal pricePerHour,
        boolean active,
        Instant createdAt
) {

    public static PriceRuleResponse from(FieldPriceRule rule) {
        return new PriceRuleResponse(
                rule.getId(),
                rule.getField().getId(),
                rule.getDayOfWeek(),
                rule.getStartTime(),
                rule.getEndTime(),
                rule.getPricePerHour(),
                rule.isActive(),
                rule.getCreatedAt());
    }
}
