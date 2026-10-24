package com.court.backend.dto.response;

import java.time.LocalTime;
import java.util.List;

public record VenueDetailResponse(
        Long id,
        String name,
        String address,
        String city,
        String district,
        String description,
        String phone,
        LocalTime openingTime,
        LocalTime closingTime,
        PolicyResponse policy,
        List<PublicFieldResponse> fields
) {
}