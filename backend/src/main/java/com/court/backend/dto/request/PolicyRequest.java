package com.court.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PolicyRequest(

        @NotNull(message = "Tỷ lệ đặt cọc không được để trống")
        @DecimalMin(value = "10.0", message = "Tỷ lệ đặt cọc tối thiểu 10%")
        @DecimalMax(value = "100.0", message = "Tỷ lệ đặt cọc tối đa 100%")
        @Digits(integer = 3, fraction = 2, message = "Tỷ lệ đặt cọc không hợp lệ")
        BigDecimal depositPercentage,

        @NotNull(message = "Hạn hủy không được để trống")
        @Min(value = 0, message = "Hạn hủy không được âm")
        @Max(value = 720, message = "Hạn hủy tối đa 720 giờ")
        Integer cancellationDeadlineHours,

        @NotNull(message = "Vui lòng chọn có hoàn tiền cọc khi khách hủy hay không")
        Boolean depositRefundableOnCustomerCancel,

        @NotNull(message = "Vui lòng chọn có hoàn tiền thanh toán toàn bộ trước hạn hủy hay không")
        Boolean fullPaymentRefundableBeforeDeadline,

        @NotNull(message = "Vui lòng chọn có hoàn đầy đủ khi chủ sân hủy hay không")
        Boolean ownerCancellationFullRefund,

        @NotNull(message = "Thời gian giữ chỗ không được để trống")
        @Min(value = 5, message = "Thời gian giữ chỗ tối thiểu 5 phút")
        @Max(value = 120, message = "Thời gian giữ chỗ tối đa 120 phút")
        Integer paymentTimeoutMinutes
) {
}