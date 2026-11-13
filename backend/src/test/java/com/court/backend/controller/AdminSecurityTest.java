package com.court.backend.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.court.backend.config.SecurityConfig;
import com.court.backend.dto.response.AdminOverviewResponse;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.GlobalExceptionHandler;
import com.court.backend.repository.UserRepository;
import com.court.backend.service.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = SystemAdminController.class,
    properties = {
      "app.jwt.secret=system-admin-test-only-secret-more-than-32-characters",
      "app.jwt.expiration-minutes=60"
    })
@ContextConfiguration(
    classes = {
      SystemAdminController.class,
      SecurityConfig.class,
      JwtService.class,
      GlobalExceptionHandler.class
    })
class AdminSecurityTest {
  @Autowired MockMvc mvc;
  @Autowired JwtService jwt;
  @MockitoBean UserRepository users;
  @MockitoBean AdminAccountService accounts;
  @MockitoBean AdminVenueService venues;
  @MockitoBean AdminOverviewService overview;

  @Test
  void anonymousDenied() throws Exception {
    mvc.perform(get("/api/admin/overview")).andExpect(status().isUnauthorized());
    verifyNoInteractions(overview);
  }

  @ParameterizedTest
  @EnumSource(
      value = UserRole.class,
      names = {"OWNER", "STAFF", "USER"})
  void nonAdminsDenied(UserRole role) throws Exception {
    mvc.perform(get("/api/admin/overview").header("Authorization", token(role)))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/admin/users/9").header("Authorization", token(role)))
        .andExpect(status().isForbidden());
    verifyNoInteractions(accounts, overview);
  }

  @Test
  void activeAdminAccepted() throws Exception {
    when(overview.overview(1L))
        .thenReturn(new AdminOverviewResponse(5, 4, 1, Map.of(), 3, 2, 1, 8, 12, Map.of()));
    mvc.perform(get("/api/admin/overview").header("Authorization", token(UserRole.ADMIN)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("totalUsers").value(5));
  }

  @Test
  void deletedAdminCannotUseOldToken() throws Exception {
    String token = token(UserRole.ADMIN);
    User user = users.findById(1L).orElseThrow();
    user.setDeletedAt(java.time.Instant.now());
    mvc.perform(get("/api/admin/overview").header("Authorization", token))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(overview);
  }

  @Test
  void demotedAdminCannotUseOldToken() throws Exception {
    String token = token(UserRole.ADMIN);
    users.findById(1L).orElseThrow().setRole(UserRole.USER);
    mvc.perform(get("/api/admin/overview").header("Authorization", token))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(overview);
  }

  @Test
  void resetPasswordRevokesOldToken() throws Exception {
    String token = token(UserRole.ADMIN);
    users.findById(1L).orElseThrow().setTokenVersion(1);
    mvc.perform(get("/api/admin/overview").header("Authorization", token))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(overview);
  }

  private String token(UserRole role) {
    User u = new User();
    u.setId(1L);
    u.setRole(role);
    when(users.findById(1L)).thenReturn(Optional.of(u));
    return "Bearer " + jwt.generateToken(u);
  }
}
