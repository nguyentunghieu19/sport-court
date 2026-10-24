package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record VenueSummaryResponse(
        Long id,
        String name,
        String address,
        String city,
        String district,
        String phone,
        LocalTime openingTime,
        LocalTime closingTime,
        List<String> sportTypes,
        int fieldCount,
        BigDecimal minBasePrice
) {
}