package com.court.backend.controller;

import com.court.backend.dto.request.CheckInByCodeRequest;
import com.court.backend.dto.request.ManagerCancelRequest;
import com.court.backend.dto.request.OnsitePaymentRequest;
import com.court.backend.dto.response.CancelResultResponse;
import com.court.backend.dto.response.ManagerBookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.PaymentResponse;
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
            @RequestParam(defaultValue = "false") boolean outstandingOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return managerBookingService.list(
                currentUserId(jwt), venueId, fieldId, date, status, keyword, outstandingOnly, page, size);
    }

    @GetMapping("/{id}")
    public ManagerBookingResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return managerBookingService.get(currentUserId(jwt), id);
    }

    @PostMapping("/{id}/check-in")
    public ManagerBookingResponse checkIn(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return managerBookingService.checkIn(currentUserId(jwt), id);
    }

    @PostMapping("/check-in")
    public ManagerBookingResponse checkInByCode(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody CheckInByCodeRequest request) {
        return managerBookingService.checkInByCode(currentUserId(jwt), request.bookingCode());
    }

    @PostMapping("/{id}/complete")
    public ManagerBookingResponse complete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return managerBookingService.complete(currentUserId(jwt), id);
    }

    @PostMapping("/{id}/no-show")
    public ManagerBookingResponse noShow(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return managerBookingService.noShow(currentUserId(jwt), id);
    }

    @PostMapping("/{id}/onsite-payment")
    public PaymentResponse recordOnsitePayment(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                               @Valid @RequestBody OnsitePaymentRequest request) {
        return managerBookingService.recordOnsitePayment(currentUserId(jwt), id, request);
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
