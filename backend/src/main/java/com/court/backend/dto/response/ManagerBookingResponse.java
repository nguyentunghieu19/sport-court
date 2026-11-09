package com.court.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ManagerBookingResponse(
        BookingResponse booking,
        Long customerId,
        String customerName,
        String customerPhone,
        String customerEmail,
        // Tổng tiền khách đã trả thành công (gồm cả tiền trả tại sân)
        BigDecimal paidAmount,
        // Tiền đã hoàn xong (yêu cầu hoàn đã được xác nhận)
        BigDecimal refundedAmount,
        // Tiền đang chờ hoàn (yêu cầu chưa xác nhận)
        BigDecimal pendingRefundAmount,
        // Tiền khách còn phải trả tại sân (chỉ tính cho đơn đã xác nhận hoặc đã hoàn thành)
        BigDecimal outstandingAmount,
        String cancelledByName,
        Instant checkedInAt,
        String checkedInByName
) {
}
