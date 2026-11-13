package com.court.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.court.backend.dto.request.AdminVenueVisibilityRequest;
import com.court.backend.entity.*;
import com.court.backend.enums.*;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AdminVenueServiceTest {
  VenueRepository venues;
  SportsFieldRepository fields;
  AdminAccessService access;
  AdminVenueService service;
  Venue venue;
  User actor;

  @BeforeEach
  void setup() {
    venues = mock(VenueRepository.class);
    fields = mock(SportsFieldRepository.class);
    access = mock(AdminAccessService.class);
    service = new AdminVenueService(venues, fields, access);
    actor = AdminAccountServiceTest.user(1L, UserRole.ADMIN);
    venue = new Venue();
    venue.setId(7L);
    venue.setOwner(AdminAccountServiceTest.user(3L, UserRole.OWNER));
    when(access.requireAdmin(1L)).thenReturn(actor);
    when(venues.findForAdminUpdate(7L)).thenReturn(Optional.of(venue));
  }

  @Test
  void hideRecordsReasonActorAndTimeWithoutChangingOwnerStatus() {
    var result =
        service.visibility(1L, 7L, new AdminVenueVisibilityRequest(true, "  Ảnh vi phạm  "));
    assertThat(result.adminHidden()).isTrue();
    assertThat(venue.getAdminHiddenReason()).isEqualTo("Ảnh vi phạm");
    assertThat(venue.getAdminHiddenBy()).isSameAs(actor);
    assertThat(venue.getAdminHiddenAt()).isNotNull();
    assertThat(venue.getStatus()).isEqualTo(VenueStatus.ACTIVE);
  }

  @Test
  void requiresReasonBeforeHiding() {
    assertThatThrownBy(() -> service.visibility(1L, 7L, new AdminVenueVisibilityRequest(true, " ")))
        .isInstanceOf(ApiException.class);
    verify(venues, never()).saveAndFlush(any());
  }

  @Test
  void unhideClearsModerationFields() {
    venue.setAdminHidden(true);
    venue.setAdminHiddenReason("old");
    venue.setAdminHiddenBy(actor);
    venue.setAdminHiddenAt(java.time.Instant.now());
    service.visibility(1L, 7L, new AdminVenueVisibilityRequest(false, null));
    assertThat(venue.isAdminHidden()).isFalse();
    assertThat(venue.getAdminHiddenReason()).isNull();
    assertThat(venue.getAdminHiddenBy()).isNull();
    assertThat(venue.getAdminHiddenAt()).isNull();
  }

  @Test
  void permissionCheckedBeforeVenueLookup() {
    when(access.requireAdmin(1L))
        .thenThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "No access"));
    assertThatThrownBy(
            () -> service.visibility(1L, 7L, new AdminVenueVisibilityRequest(true, "reason")))
        .isInstanceOf(ApiException.class);
    verifyNoInteractions(venues);
  }
}
