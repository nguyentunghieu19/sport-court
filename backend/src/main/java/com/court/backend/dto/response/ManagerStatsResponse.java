package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ManagerStatsResponse(
        // Quy mô sân bãi
        int totalVenues,
        int activeVenues,
        int inactiveVenues,
        int totalFields,
        int activeFields,
        int maintenanceFields,
        int inactiveFields,

        // Đơn đặt sân
        int totalBookings,
        int confirmedBookings,
        int pendingBookings,
        int completedBookings,
        int cancelledBookings,
        double completionRate,
        double cancellationRate,

        // Doanh thu tài chính
        BigDecimal totalRevenue,
        BigDecimal totalDeposit,
        BigDecimal totalRefunded,
        BigDecimal netRevenue,
        BigDecimal avgOrderValue,

        // Chuỗi thời gian
        List<DailyRevenuePoint> last7DaysRevenue,
        List<MonthlyRevenuePoint> monthlyRevenue,

        // Cơ cấu & Phân tích
        List<SportStatPoint> sportBreakdown,
        List<HourStatPoint> peakHoursBreakdown,
        List<TopFieldPoint> topFields,
        List<PaymentMethodStatPoint> paymentMethodBreakdown
) {
    public record DailyRevenuePoint(
            String date,
            String dayOfWeek,
            BigDecimal revenue,
            int bookingsCount
    ) {}

    public record MonthlyRevenuePoint(
            String month,
            int year,
            BigDecimal revenue,
            int bookingsCount
    ) {}

    public record SportStatPoint(
            String sportType,
            String sportLabel,
            int fieldsCount,
            int bookingsCount,
            BigDecimal revenue,
            double percentage
    ) {}

    public record HourStatPoint(
            String timeSlot,
            int bookingsCount,
            double percentage
    ) {}

    public record TopFieldPoint(
            Long fieldId,
            String fieldName,
            String venueName,
            String sportType,
            int bookingsCount,
            BigDecimal revenue
    ) {}

    public record PaymentMethodStatPoint(
            String method,
            String label,
            BigDecimal amount,
            int count,
            double percentage
    ) {}
}

