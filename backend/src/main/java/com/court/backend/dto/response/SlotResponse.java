package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalTime;

public record SlotResponse(
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal price,
        String status
) {
}