package com.court.backend.dto.request;

import com.court.backend.enums.UserRole;
import jakarta.validation.constraints.*;

public record AdminUserRequest(
    @NotBlank(message = "Họ tên không được để trống") @Size(max = 150) String fullName,
    @Email(message = "Email không hợp lệ") @Size(max = 255) String email,
    @Pattern(regexp = "^(\\+84|0)\\d{9,10}$", message = "Số điện thoại không hợp lệ") String phone,
    @Size(max = 72, message = "Mật khẩu tối đa 72 ký tự") String password,
    @NotNull(message = "Cần chọn vai trò") UserRole role,
    @NotNull(message = "Cần chọn trạng thái") Boolean active) {}
