package com.court.backend.controller;

import com.court.backend.dto.response.AvailabilityResponse;
import com.court.backend.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/public/fields")
@RequiredArgsConstructor
public class PublicAvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/{fieldId}/availability")
    public AvailabilityResponse availability(
            @PathVariable Long fieldId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.getAvailability(fieldId, date);
    }
}