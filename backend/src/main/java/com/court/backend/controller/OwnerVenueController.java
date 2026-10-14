package com.court.backend.controller;

import com.court.backend.dto.request.VenueRequest;
import com.court.backend.dto.request.VenueStatusRequest;
import com.court.backend.dto.response.VenueResponse;
import com.court.backend.service.VenueService;
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
@RequestMapping("/api/owner/venues")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerVenueController {

    private final VenueService venueService;

    @PostMapping
    public ResponseEntity<VenueResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                @Valid @RequestBody VenueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(venueService.create(currentUserId(jwt), request));
    }

    @GetMapping
    public List<VenueResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return venueService.listMine(currentUserId(jwt));
    }

    @GetMapping("/{id}")
    public VenueResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return venueService.getMine(currentUserId(jwt), id);
    }

    @PutMapping("/{id}")
    public VenueResponse update(@AuthenticationPrincipal Jwt jwt,
                                @PathVariable Long id,
                                @Valid @RequestBody VenueRequest request) {
        return venueService.update(currentUserId(jwt), id, request);
    }

    @PatchMapping("/{id}/status")
    public VenueResponse changeStatus(@AuthenticationPrincipal Jwt jwt,
                                      @PathVariable Long id,
                                      @Valid @RequestBody VenueStatusRequest request) {
        return venueService.changeStatus(currentUserId(jwt), id, request);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}