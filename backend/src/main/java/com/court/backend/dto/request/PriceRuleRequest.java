package com.court.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalTime;

public record PriceRuleRequest(

        // 0 = Chủ nhật ... 6 = Thứ bảy; null = áp dụng mọi ngày
        @Min(value = 0, message = "Thứ trong tuần từ 0 (Chủ nhật) đến 6 (Thứ bảy)")
        @Max(value = 6, message = "Thứ trong tuần từ 0 (Chủ nhật) đến 6 (Thứ bảy)")
        Short dayOfWeek,

        @NotNull(message = "Giờ bắt đầu không được để trống")
        LocalTime startTime,

        @NotNull(message = "Giờ kết thúc không được để trống")
        LocalTime endTime,

        @NotNull(message = "Giá theo giờ không được để trống")
        @DecimalMin(value = "0.0", message = "Giá theo giờ không được âm")
        @Digits(integer = 12, fraction = 2, message = "Giá theo giờ không hợp lệ")
        BigDecimal pricePerHour,

        // Bỏ trống = true
        Boolean active
) {
}