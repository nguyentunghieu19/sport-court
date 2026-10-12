package com.court.backend.dto.response;

import com.court.backend.entity.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        boolean active,
        boolean emailVerified,
        boolean phoneVerified,
        Instant createdAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.isActive(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                user.getCreatedAt());
    }
}