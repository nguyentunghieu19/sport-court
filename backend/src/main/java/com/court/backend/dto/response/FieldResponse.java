package com.court.backend.dto.response;

import com.court.backend.entity.SportsField;

import java.math.BigDecimal;
import java.time.Instant;

public record FieldResponse(
        Long id,
        Long venueId,
        String name,
        String sportType,
        String description,
        String imageUrl,
        Integer capacity,
        BigDecimal basePrice,
        String status,
        Instant createdAt,
        Instant updatedAt
) {

    public static FieldResponse from(SportsField field) {
        return new FieldResponse(
                field.getId(),
                field.getVenue().getId(),
                field.getName(),
                field.getSportType(),
                field.getDescription(),
                field.getImageUrl(),
                field.getCapacity(),
                field.getBasePrice(),
                field.getStatus().name(),
                field.getCreatedAt(),
                field.getUpdatedAt());
    }
}