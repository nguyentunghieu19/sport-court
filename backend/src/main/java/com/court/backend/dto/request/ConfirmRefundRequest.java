package com.court.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConfirmRefundRequest(

        // Hình thức và mã giao dịch hoàn tiền, hoặc ghi chú đã trả tiền mặt
        @NotBlank(message = "Vui lòng nhập ghi chú hoàn tiền (hình thức, mã giao dịch)")
        @Size(max = 150, message = "Ghi chú tối đa 150 ký tự")
        String note
) {
}