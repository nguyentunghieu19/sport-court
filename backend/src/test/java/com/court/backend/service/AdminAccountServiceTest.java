package com.court.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.court.backend.dto.request.AdminUserRequest;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AdminAccountServiceTest {
  UserRepository users;
  VenueRepository venues;
  VenueStaffRepository assignments;
  AdminAccessService access;
  AdminAccountService service;
  User actor, target;

  @BeforeEach
  void setup() {
    users = mock(UserRepository.class);
    venues = mock(VenueRepository.class);
    assignments = mock(VenueStaffRepository.class);
    access = mock(AdminAccessService.class);
    service =
        new AdminAccountService(users, venues, assignments, access, new BCryptPasswordEncoder());
    actor = user(1L, UserRole.ADMIN);
    target = user(2L, UserRole.USER);
    when(access.requireAdmin(1L)).thenReturn(actor);
    when(users.lockActiveAdministrators()).thenReturn(List.of(actor));
    when(users.findById(2L)).thenReturn(Optional.of(target));
    when(users.saveAndFlush(any()))
        .thenAnswer(
            i -> {
              User u = i.getArgument(0);
              if (u.getId() == null) u.setId(3L);
              return u;
            });
  }

  @Test
  void createHashesPasswordAndAssignsRequestedRole() {
    var result = service.create(1L, request(UserRole.OWNER, true, "StrongPass123!"));
    assertThat(result.role()).isEqualTo("OWNER");
    var cap = org.mockito.ArgumentCaptor.forClass(User.class);
    verify(users).saveAndFlush(cap.capture());
    assertThat(
            new BCryptPasswordEncoder().matches("StrongPass123!", cap.getValue().getPasswordHash()))
        .isTrue();
    assertThat(cap.getValue().getEmail()).isEqualTo("new@example.test");
  }

  @Test
  void cannotReuseEmailStillInUse() {
    when(users.existsByEmail("new@example.test")).thenReturn(true);
    assertThatThrownBy(() -> service.create(1L, request(UserRole.USER, true, "StrongPass123!")))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Email");
  }

  @Test
  void cannotDeleteSelf() {
    when(users.findById(1L)).thenReturn(Optional.of(actor));
    assertThatThrownBy(() -> service.delete(1L, 1L)).isInstanceOf(ApiException.class);
    verify(users, never()).saveAndFlush(any());
  }

  @Test
  void canEditOwnProfileWithoutLosingAdminRoleOrSession() {
    when(users.findById(1L)).thenReturn(Optional.of(actor));
    var result = service.update(1L, 1L, request(UserRole.ADMIN, true, null));
    assertThat(result.id()).isEqualTo(1L);
    assertThat(result.fullName()).isEqualTo("Tài khoản mới");
    assertThat(result.role()).isEqualTo("ADMIN");
    assertThat(result.active()).isTrue();
    assertThat(actor.getTokenVersion()).isZero();
  }

  @Test
  void canChangeOwnPasswordAndRevokeOldSession() {
    when(users.findById(1L)).thenReturn(Optional.of(actor));
    service.update(1L, 1L, request(UserRole.ADMIN, true, "NewSelfPassword123!"));
    assertThat(new BCryptPasswordEncoder().matches("NewSelfPassword123!", actor.getPasswordHash()))
        .isTrue();
    assertThat(actor.getRole()).isEqualTo(UserRole.ADMIN);
    assertThat(actor.getTokenVersion()).isEqualTo(1);
  }

  @Test
  void cannotDemoteOrDeactivateSelf() {
    when(users.findById(1L)).thenReturn(Optional.of(actor));
    assertThatThrownBy(() -> service.update(1L, 1L, request(UserRole.USER, true, null)))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.update(1L, 1L, request(UserRole.ADMIN, false, null)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void cannotDemoteOwnerWithVenues() {
    target.setRole(UserRole.OWNER);
    when(venues.existsByOwnerId(2L)).thenReturn(true);
    assertThatThrownBy(() -> service.update(1L, 2L, request(UserRole.USER, true, null)))
        .hasMessageContaining("địa điểm");
  }

  @Test
  void cannotDemoteAssignedStaff() {
    target.setRole(UserRole.STAFF);
    when(assignments.existsByStaffId(2L)).thenReturn(true);
    assertThatThrownBy(() -> service.update(1L, 2L, request(UserRole.USER, true, null)))
        .hasMessageContaining("phân công");
  }

  @Test
  void deleteKeepsRecordAndInvalidatesSessions() {
    target.setEmail("old@example.test");
    target.setPhone("0912345678");
    target.setEmailVerified(true);
    target.setPhoneVerified(true);
    service.delete(1L, 2L);
    assertThat(target.getId()).isEqualTo(2L);
    assertThat(target.getEmail()).isNull();
    assertThat(target.getPhone()).isNull();
    assertThat(target.isEmailVerified()).isFalse();
    assertThat(target.isPhoneVerified()).isFalse();
    assertThat(target.getDeletedAt()).isNotNull();
    assertThat(target.isActive()).isFalse();
    assertThat(target.getTokenVersion()).isEqualTo(1);
    verify(users).saveAndFlush(target);
    verify(users, never()).delete(any(User.class));
  }

  @Test
  void resetPasswordInvalidatesOldTokens() {
    service.update(1L, 2L, request(UserRole.USER, true, "NewPassword123!"));
    assertThat(target.getTokenVersion()).isEqualTo(1);
    assertThat(new BCryptPasswordEncoder().matches("NewPassword123!", target.getPasswordHash()))
        .isTrue();
  }

  @Test
  void blankPasswordPreservesExistingPassword() {
    target.setPasswordHash("existing-hash");
    service.update(1L, 2L, request(UserRole.USER, true, ""));
    assertThat(target.getPasswordHash()).isEqualTo("existing-hash");
    assertThat(target.getTokenVersion()).isZero();
  }

  @Test
  void cannotEditDeletedAccount() {
    target.setDeletedAt(Instant.now());
    assertThatThrownBy(() -> service.update(1L, 2L, request(UserRole.USER, true, null)))
        .hasMessageContaining("Không tìm thấy");
  }

  @Test
  void utf8BcryptLimitRejected() {
    assertThatThrownBy(() -> service.create(1L, request(UserRole.USER, true, "ậ".repeat(25))))
        .isInstanceOf(ApiException.class);
  }

  static User user(Long id, UserRole role) {
    User u = new User();
    u.setId(id);
    u.setRole(role);
    u.setFullName("Test account");
    return u;
  }

  static AdminUserRequest request(UserRole role, boolean active, String password) {
    return new AdminUserRequest("Tài khoản mới", "NEW@example.test", null, password, role, active);
  }
}

