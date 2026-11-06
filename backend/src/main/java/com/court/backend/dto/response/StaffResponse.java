package com.court.backend.dto.response;

import java.time.Instant;
import java.util.List;

public record StaffResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        boolean active,
        Instant createdAt,
        List<VenueAssignment> venues
) {

    // assigned = true: đang được phân công; false: đã bị gỡ phân công (vẫn lưu lịch sử)
    public record VenueAssignment(
            Long venueId,
            String venueName,
            boolean assigned,
            Instant assignedAt
    ) {
    }
}