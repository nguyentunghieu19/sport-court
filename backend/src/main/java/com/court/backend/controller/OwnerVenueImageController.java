package com.court.backend.controller;

import com.court.backend.dto.response.VenueResponse;
import com.court.backend.service.VenueImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/owner/venues/{id}/image")
@PreAuthorize("hasRole('OWNER')")
@RequiredArgsConstructor
public class OwnerVenueImageController {
    private final VenueImageService imageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VenueResponse upload(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                @RequestPart("file") MultipartFile file) {
        return imageService.upload(Long.valueOf(jwt.getSubject()), id, file);
    }

    @DeleteMapping
    public VenueResponse delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return imageService.delete(Long.valueOf(jwt.getSubject()), id);
    }
}
