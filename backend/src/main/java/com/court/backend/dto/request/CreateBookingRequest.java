package com.court.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(

        @NotNull(message = "Vui lòng chọn sân")
        Long fieldId,

        @NotNull(message = "Vui lòng chọn ngày chơi")
        LocalDate date,

        @NotNull(message = "Vui lòng chọn giờ bắt đầu")
        LocalTime startTime,

        @NotNull(message = "Vui lòng chọn giờ kết thúc")
        LocalTime endTime,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note
) {
}