package com.court.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManagerCancelRequest(

        @NotBlank(message = "Vui lòng nhập lý do hủy đơn")
        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {
}