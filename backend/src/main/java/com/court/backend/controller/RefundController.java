package com.court.backend.controller;

import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.RefundResponse;
import com.court.backend.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/refunds")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping("/my")
    public PageResponse<RefundResponse> listMine(@AuthenticationPrincipal Jwt jwt,
                                                 @RequestParam(required = false) Long bookingId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        return refundService.listMine(Long.valueOf(jwt.getSubject()), bookingId, page, size);
    }
}