package com.court.backend.controller;

import com.court.backend.dto.request.FieldRequest;
import com.court.backend.dto.request.FieldStatusRequest;
import com.court.backend.dto.response.FieldResponse;
import com.court.backend.service.FieldService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner/venues/{venueId}/fields")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerFieldController {

    private final FieldService fieldService;

    @PostMapping
    public ResponseEntity<FieldResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                @PathVariable Long venueId,
                                                @Valid @RequestBody FieldRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fieldService.create(currentUserId(jwt), venueId, request));
    }

    @GetMapping
    public List<FieldResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long venueId) {
        return fieldService.list(currentUserId(jwt), venueId);
    }

    @GetMapping("/{fieldId}")
    public FieldResponse get(@AuthenticationPrincipal Jwt jwt,
                             @PathVariable Long venueId,
                             @PathVariable Long fieldId) {
        return fieldService.get(currentUserId(jwt), venueId, fieldId);
    }

    @PutMapping("/{fieldId}")
    public FieldResponse update(@AuthenticationPrincipal Jwt jwt,
                                @PathVariable Long venueId,
                                @PathVariable Long fieldId,
                                @Valid @RequestBody FieldRequest request) {
        return fieldService.update(currentUserId(jwt), venueId, fieldId, request);
    }

    @PatchMapping("/{fieldId}/status")
    public FieldResponse changeStatus(@AuthenticationPrincipal Jwt jwt,
                                      @PathVariable Long venueId,
                                      @PathVariable Long fieldId,
                                      @Valid @RequestBody FieldStatusRequest request) {
        return fieldService.changeStatus(currentUserId(jwt), venueId, fieldId, request);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}