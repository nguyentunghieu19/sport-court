package com.court.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.court.backend.dto.request.CreateBookingRequest;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.FieldStatus;
import com.court.backend.enums.UserRole;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;

class AdminVenueVisibilityTest {
  enum Reason {
    ADMIN_HIDDEN,
    DELETED_OWNER,
    INACTIVE
  }

  @ParameterizedTest
  @EnumSource(Reason.class)
  void directVenueLinkCannotBypassModeration(Reason reason) {
    var venues = mock(VenueRepository.class);
    var fields = mock(SportsFieldRepository.class);
    var policies = mock(BookingPolicyRepository.class);
    when(venues.findById(7L)).thenReturn(Optional.of(venue(reason)));
    var service = new PublicCatalogService(venues, fields, policies);
    assertNotFound(() -> service.getVenueDetail(7L));
    verifyNoInteractions(fields, policies);
  }

  @ParameterizedTest
  @EnumSource(Reason.class)
  void directAvailabilityLinkCannotBypassModeration(Reason reason) {
    var fields = mock(SportsFieldRepository.class);
    var prices = mock(FieldPriceRuleRepository.class);
    var bookings = mock(BookingRepository.class);
    var blocks = mock(FieldBlockRepository.class);
    var pricing = mock(PricingService.class);
    when(fields.findById(9L)).thenReturn(Optional.of(field(reason)));
    var service = new AvailabilityService(fields, prices, bookings, blocks, pricing);
    assertNotFound(() -> service.getAvailability(9L, LocalDate.now().plusDays(1)));
    verifyNoInteractions(prices, bookings, blocks, pricing);
  }

  @ParameterizedTest
  @EnumSource(Reason.class)
  void directCreateBookingCannotBypassModeration(Reason reason) {
    var bookings = mock(BookingRepository.class);
    var users = mock(UserRepository.class);
    var fields = mock(SportsFieldRepository.class);
    User customer = new User();
    customer.setId(1L);
    customer.setRole(UserRole.USER);
    when(users.findById(1L)).thenReturn(Optional.of(customer));
    when(fields.findById(9L)).thenReturn(Optional.of(field(reason)));
    var service =
        new BookingService(
            bookings,
            users,
            fields,
            mock(FieldPriceRuleRepository.class),
            mock(FieldBlockRepository.class),
            mock(BookingPolicyRepository.class),
            mock(PricingService.class));
    var request =
        new CreateBookingRequest(
            9L, LocalDate.now().plusDays(1), LocalTime.of(10, 0), LocalTime.of(11, 0), null);
    assertNotFound(() -> service.create(1L, request));
    verifyNoInteractions(bookings);
  }

  private Venue venue(Reason reason) {
    User owner = new User();
    owner.setId(2L);
    owner.setRole(UserRole.OWNER);
    Venue venue = new Venue();
    venue.setId(7L);
    venue.setOwner(owner);
    if (reason == Reason.ADMIN_HIDDEN) venue.setAdminHidden(true);
    if (reason == Reason.DELETED_OWNER) owner.setDeletedAt(Instant.now());
    if (reason == Reason.INACTIVE) venue.setStatus(VenueStatus.INACTIVE);
    return venue;
  }

  private SportsField field(Reason reason) {
    SportsField field = new SportsField();
    field.setId(9L);
    field.setStatus(FieldStatus.ACTIVE);
    field.setVenue(venue(reason));
    return field;
  }

  private void assertNotFound(Runnable action) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            ApiException.class,
            error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
  }
}
