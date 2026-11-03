package com.court.backend.dto.request;

import jakarta.validation.constraints.Size;

public record CancelBookingRequest(

        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {
}