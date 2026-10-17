package com.court.backend.dto.request;

import com.court.backend.enums.FieldStatus;
import jakarta.validation.constraints.NotNull;

public record FieldStatusRequest(

        @NotNull(message = "Trạng thái không được để trống")
        FieldStatus status
) {
}