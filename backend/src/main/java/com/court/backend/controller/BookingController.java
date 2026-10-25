package com.court.backend.controller;

import com.court.backend.dto.request.CreateBookingRequest;
import com.court.backend.dto.response.BookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.enums.BookingStatus;
import com.court.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/bookings")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                  @Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.create(currentUserId(jwt), request));
    }

    @GetMapping("/my")
    public PageResponse<BookingResponse> listMine(@AuthenticationPrincipal Jwt jwt,
                                                  @RequestParam(required = false) BookingStatus status,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return bookingService.listMine(currentUserId(jwt), status, page, size);
    }

    @GetMapping("/{id}")
    public BookingResponse getMine(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return bookingService.getMine(currentUserId(jwt), id);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
