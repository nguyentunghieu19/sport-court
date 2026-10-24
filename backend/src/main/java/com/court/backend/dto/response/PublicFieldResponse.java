package com.court.backend.dto.response;

import com.court.backend.entity.SportsField;

import java.math.BigDecimal;

public record PublicFieldResponse(
        Long id,
        String name,
        String sportType,
        String description,
        String imageUrl,
        Integer capacity,
        BigDecimal basePrice,
        String status
) {

    public static PublicFieldResponse from(SportsField field) {
        return new PublicFieldResponse(
                field.getId(),
                field.getName(),
                field.getSportType(),
                field.getDescription(),
                field.getImageUrl(),
                field.getCapacity(),
                field.getBasePrice(),
                field.getStatus().name());
    }
}