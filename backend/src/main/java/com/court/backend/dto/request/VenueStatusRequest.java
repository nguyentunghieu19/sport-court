package com.court.backend.dto.request;

import com.court.backend.enums.VenueStatus;
import jakarta.validation.constraints.NotNull;

public record VenueStatusRequest(

        @NotNull(message = "Trạng thái không được để trống")
        VenueStatus status
) {
}