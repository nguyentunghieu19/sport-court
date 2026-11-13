package com.court.backend.controller;

import com.court.backend.dto.request.*;
import com.court.backend.dto.response.*;
import com.court.backend.enums.*;
import com.court.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SystemAdminController {
  private final AdminAccountService accounts;
  private final AdminVenueService venues;
  private final AdminOverviewService overview;

  @GetMapping("/overview")
  public AdminOverviewResponse overview(@AuthenticationPrincipal Jwt jwt) {
    return overview.overview(id(jwt));
  }

  @GetMapping("/users")
  public PageResponse<AdminUserResponse> users(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) UserRole role,
      @RequestParam(required = false) Boolean active,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return accounts.list(id(jwt), keyword, role, active, page, size);
  }

  @PostMapping("/users")
  public ResponseEntity<AdminUserResponse> create(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AdminUserRequest r) {
    return ResponseEntity.status(HttpStatus.CREATED).body(accounts.create(id(jwt), r));
  }

  @PutMapping("/users/{userId}")
  public AdminUserResponse update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long userId,
      @Valid @RequestBody AdminUserRequest r) {
    return accounts.update(id(jwt), userId, r);
  }

  @DeleteMapping("/users/{userId}")
  public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long userId) {
    accounts.delete(id(jwt), userId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/venues")
  public PageResponse<AdminVenueResponse> venues(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) Boolean hidden,
      @RequestParam(required = false) VenueStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return venues.list(id(jwt), keyword, hidden, status, page, size);
  }

  @GetMapping("/venues/{venueId}")
  public AdminVenueResponse venue(@AuthenticationPrincipal Jwt jwt, @PathVariable Long venueId) {
    return venues.detail(id(jwt), venueId);
  }

  @PatchMapping("/venues/{venueId}/visibility")
  public AdminVenueResponse visibility(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable Long venueId,
      @Valid @RequestBody AdminVenueVisibilityRequest r) {
    return venues.visibility(id(jwt), venueId, r);
  }

  private Long id(Jwt jwt) {
    return Long.valueOf(jwt.getSubject());
  }
}
