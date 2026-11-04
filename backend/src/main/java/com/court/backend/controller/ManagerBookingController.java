package com.court.backend.controller;

import com.court.backend.dto.request.ManagerCancelRequest;
import com.court.backend.dto.response.CancelResultResponse;
import com.court.backend.dto.response.ManagerBookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.enums.BookingStatus;
import com.court.backend.service.CancellationService;
import com.court.backend.service.ManagerBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;

@RestController
@RequestMapping("/api/manage/bookings")
@PreAuthorize("hasAnyRole('OWNER','STAFF')")
@RequiredArgsConstructor
public class ManagerBookingController {

    private final ManagerBookingService managerBookingService;
    private final CancellationService cancellationService;

    @GetMapping
    public PageResponse<ManagerBookingResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) Long fieldId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return managerBookingService.list(
                currentUserId(jwt), venueId, fieldId, date, status, keyword, page, size);
    }

    @GetMapping("/{id}")
    public ManagerBookingResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return managerBookingService.get(currentUserId(jwt), id);
    }

    @PostMapping("/{id}/cancel")
    public CancelResultResponse cancel(@AuthenticationPrincipal Jwt jwt,
                                       @PathVariable Long id,
                                       @Valid @RequestBody ManagerCancelRequest request) {
        return cancellationService.cancelByManager(currentUserId(jwt), id, request.reason());
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}