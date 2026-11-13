package com.court.backend.dto.response;

import com.court.backend.entity.User;
import java.time.Instant;

public record AdminUserResponse(
    Long id,
    String fullName,
    String email,
    String phone,
    String role,
    boolean active,
    Instant createdAt,
    Instant updatedAt) {
  public static AdminUserResponse from(User u) {
    return new AdminUserResponse(
        u.getId(),
        u.getFullName(),
        u.getEmail(),
        u.getPhone(),
        u.getRole().name(),
        u.isActive(),
        u.getCreatedAt(),
        u.getUpdatedAt());
  }
}
