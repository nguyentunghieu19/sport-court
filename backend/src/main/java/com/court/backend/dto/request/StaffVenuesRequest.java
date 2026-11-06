package com.court.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record StaffVenuesRequest(

        // Danh sách địa điểm được phân công sau khi cập nhật; danh sách rỗng nghĩa là gỡ hết phân công
        @NotNull(message = "Vui lòng gửi danh sách địa điểm")
        List<@NotNull(message = "Mã địa điểm không hợp lệ") Long> venueIds
) {
}