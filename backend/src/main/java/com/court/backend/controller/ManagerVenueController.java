package com.court.backend.controller;

import com.court.backend.dto.response.FieldResponse;
import com.court.backend.dto.response.ManagedVenueResponse;
import com.court.backend.service.ManagerVenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manage/venues")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class ManagerVenueController {

    private final ManagerVenueService managerVenueService;

    @GetMapping
    public List<ManagedVenueResponse> listVenues(@AuthenticationPrincipal Jwt jwt) {
        return managerVenueService.listVenues(currentUserId(jwt));
    }

    @GetMapping("/{venueId}/fields")
    public List<FieldResponse> listFields(@AuthenticationPrincipal Jwt jwt, @PathVariable Long venueId) {
        return managerVenueService.listFields(currentUserId(jwt), venueId);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}