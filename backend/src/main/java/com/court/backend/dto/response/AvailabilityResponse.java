package com.court.backend.dto.response;

import java.time.LocalDate;
import java.util.List;

public record AvailabilityResponse(
        Long fieldId,
        String fieldName,
        String sportType,
        Long venueId,
        String venueName,
        LocalDate date,
        String fieldStatus,
        boolean bookable,
        List<SlotResponse> slots
) {
}
