package com.court.backend.dto.response;

import com.court.backend.entity.Venue;

import java.time.Instant;
import java.time.LocalTime;

public record VenueResponse(
        Long id,
        Long ownerId,
        String name,
        String address,
        String city,
        String district,
        String description,
        String phone,
        LocalTime openingTime,
        LocalTime closingTime,
        String status,
        Instant createdAt,
        Instant updatedAt
) {

    public static VenueResponse from(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getOwner().getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getDistrict(),
                venue.getDescription(),
                venue.getPhone(),
                venue.getOpeningTime(),
                venue.getClosingTime(),
                venue.getStatus().name(),
                venue.getCreatedAt(),
                venue.getUpdatedAt());
    }
}