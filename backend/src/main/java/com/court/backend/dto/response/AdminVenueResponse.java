package com.court.backend.dto.response;

import com.court.backend.entity.Venue;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

public record AdminVenueResponse(
    Long id,
    String name,
    String address,
    String city,
    String district,
    String description,
    String imageUrl,
    String phone,
    LocalTime openingTime,
    LocalTime closingTime,
    String status,
    Long ownerId,
    String ownerName,
    String ownerEmail,
    String ownerPhone,
    boolean ownerDeleted,
    boolean ownerActive,
    int fieldCount,
    boolean adminHidden,
    String adminHiddenReason,
    Instant adminHiddenAt,
    List<FieldResponse> fields) {
  public static AdminVenueResponse from(Venue v, List<FieldResponse> fields) {
    var u = v.getOwner();
    return new AdminVenueResponse(
        v.getId(),
        v.getName(),
        v.getAddress(),
        v.getCity(),
        v.getDistrict(),
        v.getDescription(),
        v.getImageUrl(),
        v.getPhone(),
        v.getOpeningTime(),
        v.getClosingTime(),
        v.getStatus().name(),
        u.getId(),
        u.getFullName(),
        u.getEmail(),
        u.getPhone(),
        u.getDeletedAt() != null,
        u.isActive(),
        fields.size(),
        v.isAdminHidden(),
        v.getAdminHiddenReason(),
        v.getAdminHiddenAt(),
        fields);
  }
}
