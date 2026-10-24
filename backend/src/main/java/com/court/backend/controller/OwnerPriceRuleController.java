package com.court.backend.controller;

import com.court.backend.dto.request.PriceRuleRequest;
import com.court.backend.dto.response.PriceRuleResponse;
import com.court.backend.service.PriceRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner/venues/{venueId}/fields/{fieldId}/price-rules")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerPriceRuleController {

    private final PriceRuleService priceRuleService;

    @PostMapping
    public ResponseEntity<PriceRuleResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                    @PathVariable Long venueId,
                                                    @PathVariable Long fieldId,
                                                    @Valid @RequestBody PriceRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(priceRuleService.create(currentUserId(jwt), venueId, fieldId, request));
    }

    @GetMapping
    public List<PriceRuleResponse> list(@AuthenticationPrincipal Jwt jwt,
                                        @PathVariable Long venueId,
                                        @PathVariable Long fieldId) {
        return priceRuleService.list(currentUserId(jwt), venueId, fieldId);
    }

    @PutMapping("/{ruleId}")
    public PriceRuleResponse update(@AuthenticationPrincipal Jwt jwt,
                                    @PathVariable Long venueId,
                                    @PathVariable Long fieldId,
                                    @PathVariable Long ruleId,
                                    @Valid @RequestBody PriceRuleRequest request) {
        return priceRuleService.update(currentUserId(jwt), venueId, fieldId, ruleId, request);
    }

    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt,
                                       @PathVariable Long venueId,
                                       @PathVariable Long fieldId,
                                       @PathVariable Long ruleId) {
        priceRuleService.delete(currentUserId(jwt), venueId, fieldId, ruleId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
