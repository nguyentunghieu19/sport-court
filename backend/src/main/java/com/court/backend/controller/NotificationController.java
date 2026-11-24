package com.court.backend.controller;

import com.court.backend.dto.response.*;
import com.court.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'STAFF')")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    @GetMapping
    public PageResponse<NotificationResponse> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(Long.valueOf(jwt.getSubject()), unreadOnly, page, size);
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("unreadCount", service.unreadCount(Long.valueOf(jwt.getSubject())));
    }

    @PatchMapping("/{id}/read")
    public void read(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.read(Long.valueOf(jwt.getSubject()), id);
    }

    @PatchMapping("/read-all")
    public void readAll(@AuthenticationPrincipal Jwt jwt) {
        service.readAll(Long.valueOf(jwt.getSubject()));
    }
}
