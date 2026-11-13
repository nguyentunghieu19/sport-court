package com.court.backend.service;

import com.court.backend.dto.response.AdminOverviewResponse;
import com.court.backend.enums.*;
import com.court.backend.repository.*;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOverviewService {
  private final UserRepository users;
  private final VenueRepository venues;
  private final SportsFieldRepository fields;
  private final BookingRepository bookings;
  private final AdminAccessService access;

  @Transactional(readOnly = true)
  public AdminOverviewResponse overview(Long actor) {
    access.requireAdmin(actor);
    Map<String, Long> roles = new LinkedHashMap<>(), statuses = new LinkedHashMap<>();
    for (var r : UserRole.values()) roles.put(r.name(), users.countByDeletedAtIsNullAndRole(r));
    for (var s : BookingStatus.values()) statuses.put(s.name(), bookings.countByStatus(s));
    return new AdminOverviewResponse(
        users.countByDeletedAtIsNull(),
        users.countByDeletedAtIsNullAndActiveTrue(),
        users.countByDeletedAtIsNotNull(),
        roles,
        venues.count(),
        venues.countByStatusAndAdminHiddenFalse(VenueStatus.ACTIVE),
        venues.countByAdminHiddenTrue(),
        fields.count(),
        bookings.count(),
        statuses);
  }
}
