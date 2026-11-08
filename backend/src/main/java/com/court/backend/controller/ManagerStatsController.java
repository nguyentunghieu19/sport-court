package com.court.backend.controller;

import com.court.backend.dto.response.ManagerStatsResponse;
import com.court.backend.service.ManagerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manage/stats")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class ManagerStatsController {

    private final ManagerStatsService managerStatsService;

    @GetMapping
    public ManagerStatsResponse getStats(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long venueId) {
        return managerStatsService.getStats(currentUserId(jwt), venueId);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}

