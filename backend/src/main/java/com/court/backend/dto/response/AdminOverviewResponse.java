package com.court.backend.dto.response;

import java.util.Map;

public record AdminOverviewResponse(
    long totalUsers,
    long activeUsers,
    long deletedUsers,
    Map<String, Long> usersByRole,
    long totalVenues,
    long activeVenues,
    long hiddenVenues,
    long totalFields,
    long totalBookings,
    Map<String, Long> bookingsByStatus) {}
