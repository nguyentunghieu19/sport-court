package com.court.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckInByCodeRequest(
        @NotBlank @Size(max = 40) String bookingCode
) {
}
