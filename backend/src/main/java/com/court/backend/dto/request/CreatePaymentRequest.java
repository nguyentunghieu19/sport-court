package com.court.backend.dto.request;

import com.court.backend.enums.PaymentType;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(

        @NotNull(message = "Vui lòng chọn đơn đặt sân")
        Long bookingId,

        // DEPOSIT = trả tiền cọc (phần còn lại trả tại sân); FULL = trả toàn bộ
        @NotNull(message = "Vui lòng chọn hình thức thanh toán")
        PaymentType paymentType
) {
}