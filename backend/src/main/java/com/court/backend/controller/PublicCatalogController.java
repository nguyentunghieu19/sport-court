package com.court.backend.controller;

import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.SportTypeResponse;
import com.court.backend.dto.response.VenueDetailResponse;
import com.court.backend.dto.response.VenueSummaryResponse;
import com.court.backend.enums.SportType;
import com.court.backend.service.PublicCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicCatalogController {

    private final PublicCatalogService publicCatalogService;

    @GetMapping("/sport-types")
    public List<SportTypeResponse> sportTypes() {
        return publicCatalogService.listSportTypes();
    }

    @GetMapping("/venues")
    public PageResponse<VenueSummaryResponse> searchVenues(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) SportType sportType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return publicCatalogService.searchVenues(city, district, keyword, sportType, page, size);
    }

    @GetMapping("/venues/{id}")
    public VenueDetailResponse venueDetail(@PathVariable Long id) {
        return publicCatalogService.getVenueDetail(id);
    }
}