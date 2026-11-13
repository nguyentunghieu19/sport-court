package com.court.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.court.backend.enums.*;
import com.court.backend.repository.*;
import org.junit.jupiter.api.Test;

class AdminOverviewServiceTest {
  @Test
  void returnsRepositoryCountsAndEveryBookingStatus() {
    var users = mock(UserRepository.class);
    var venues = mock(VenueRepository.class);
    var fields = mock(SportsFieldRepository.class);
    var bookings = mock(BookingRepository.class);
    var access = mock(AdminAccessService.class);
    when(users.countByDeletedAtIsNull()).thenReturn(12L);
    when(users.countByDeletedAtIsNotNull()).thenReturn(3L);
    when(users.countByDeletedAtIsNullAndActiveTrue()).thenReturn(9L);
    when(venues.count()).thenReturn(5L);
    when(venues.countByAdminHiddenTrue()).thenReturn(2L);
    when(venues.countByStatusAndAdminHiddenFalse(VenueStatus.ACTIVE)).thenReturn(3L);
    when(fields.count()).thenReturn(20L);
    when(bookings.count()).thenReturn(40L);
    when(bookings.countByStatus(BookingStatus.NO_SHOW)).thenReturn(4L);
    var result = new AdminOverviewService(users, venues, fields, bookings, access).overview(1L);
    assertThat(result.totalUsers()).isEqualTo(12);
    assertThat(result.deletedUsers()).isEqualTo(3);
    assertThat(result.activeUsers()).isEqualTo(9);
    assertThat(result.activeVenues()).isEqualTo(3);
    assertThat(result.totalFields()).isEqualTo(20);
    assertThat(result.totalBookings()).isEqualTo(40);
    assertThat(result.bookingsByStatus())
        .hasSize(BookingStatus.values().length)
        .containsEntry("NO_SHOW", 4L);
    verify(access).requireAdmin(1L);
  }
}
