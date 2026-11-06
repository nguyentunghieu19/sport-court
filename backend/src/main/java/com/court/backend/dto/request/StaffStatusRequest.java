package com.court.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record StaffStatusRequest(

        // true = mở khóa, false = khóa tài khoản
        @NotNull(message = "Vui lòng chọn trạng thái tài khoản")
        Boolean active
) {
}