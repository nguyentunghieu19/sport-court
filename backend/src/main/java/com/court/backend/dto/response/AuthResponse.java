package com.court.backend.dto.response;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        Long userId,
        String fullName,
        String role
) {
}