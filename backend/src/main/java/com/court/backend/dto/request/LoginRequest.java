package com.court.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "Vui lòng nhập email hoặc số điện thoại")
        String identifier,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {
}
