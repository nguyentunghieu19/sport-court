package com.court.backend.controller;

import com.court.backend.dto.request.PolicyRequest;
import com.court.backend.dto.response.PolicyResponse;
import com.court.backend.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/venues/{venueId}/policy")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerPolicyController {

    private final PolicyService policyService;

    @GetMapping
    public PolicyResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long venueId) {
        return policyService.get(currentUserId(jwt), venueId);
    }

    @PutMapping
    public PolicyResponse update(@AuthenticationPrincipal Jwt jwt,
                                 @PathVariable Long venueId,
                                 @Valid @RequestBody PolicyRequest request) {
        return policyService.update(currentUserId(jwt), venueId, request);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}