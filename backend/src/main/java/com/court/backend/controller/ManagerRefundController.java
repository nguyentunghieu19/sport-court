package com.court.backend.controller;

import com.court.backend.dto.request.ConfirmRefundRequest;
import com.court.backend.dto.response.ManagerRefundResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.enums.RefundStatus;
import com.court.backend.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manage/refunds")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class ManagerRefundController {

    private final RefundService refundService;

    @GetMapping
    public PageResponse<ManagerRefundResponse> list(@AuthenticationPrincipal Jwt jwt,
                                                    @RequestParam(required = false) Long venueId,
                                                    @RequestParam(required = false) RefundStatus status,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        return refundService.listForManager(currentUserId(jwt), venueId, status, page, size);
    }

    @PostMapping("/{id}/confirm")
    public ManagerRefundResponse confirm(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable Long id,
                                         @Valid @RequestBody ConfirmRefundRequest request) {
        return refundService.confirm(currentUserId(jwt), id, request.note());
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}