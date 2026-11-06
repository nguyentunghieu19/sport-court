package com.court.backend.dto.response;

import com.court.backend.entity.Venue;

import java.time.LocalTime;

public record ManagedVenueResponse(
        Long id,
        String name,
        String address,
        String city,
        String district,
        String phone,
        LocalTime openingTime,
        LocalTime closingTime,
        String status
) {

    public static ManagedVenueResponse from(Venue venue) {
        return new ManagedVenueResponse(
                venue.getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getDistrict(),
                venue.getPhone(),
                venue.getOpeningTime(),
                venue.getClosingTime(),
                venue.getStatus().name());
    }
}