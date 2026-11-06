package com.court.backend.controller;

import com.court.backend.dto.request.ResetStaffPasswordRequest;
import com.court.backend.dto.request.StaffCreateRequest;
import com.court.backend.dto.request.StaffStatusRequest;
import com.court.backend.dto.request.StaffUpdateRequest;
import com.court.backend.dto.request.StaffVenuesRequest;
import com.court.backend.dto.response.StaffResponse;
import com.court.backend.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner/staff")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerStaffController {

    private final StaffService staffService;

    @PostMapping
    public ResponseEntity<StaffResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody StaffCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(staffService.create(currentUserId(jwt), request));
    }

    @GetMapping
    public List<StaffResponse> list(@AuthenticationPrincipal Jwt jwt,
                                    @RequestParam(required = false) Long venueId) {
        return staffService.list(currentUserId(jwt), venueId);
    }

    @GetMapping("/{id}")
    public StaffResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return staffService.get(currentUserId(jwt), id);
    }

    @PutMapping("/{id}")
    public StaffResponse update(@AuthenticationPrincipal Jwt jwt,
                                @PathVariable Long id,
                                @Valid @RequestBody StaffUpdateRequest request) {
        return staffService.update(currentUserId(jwt), id, request);
    }

    @PatchMapping("/{id}/status")
    public StaffResponse setStatus(@AuthenticationPrincipal Jwt jwt,
                                   @PathVariable Long id,
                                   @Valid @RequestBody StaffStatusRequest request) {
        return staffService.setStatus(currentUserId(jwt), id, request.active());
    }

    @PutMapping("/{id}/venues")
    public StaffResponse setVenues(@AuthenticationPrincipal Jwt jwt,
                                   @PathVariable Long id,
                                   @Valid @RequestBody StaffVenuesRequest request) {
        return staffService.setVenues(currentUserId(jwt), id, request.venueIds());
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@AuthenticationPrincipal Jwt jwt,
                                              @PathVariable Long id,
                                              @Valid @RequestBody ResetStaffPasswordRequest request) {
        staffService.resetPassword(currentUserId(jwt), id, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}