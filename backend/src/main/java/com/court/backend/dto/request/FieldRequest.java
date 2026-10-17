package com.court.backend.dto.request;

import com.court.backend.enums.SportType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FieldRequest(

        @NotBlank(message = "Tên sân không được để trống")
        @Size(max = 150, message = "Tên sân tối đa 150 ký tự")
        String name,

        @NotNull(message = "Môn thể thao không được để trống")
        SportType sportType,

        String description,

        @Size(max = 2000, message = "Đường dẫn ảnh tối đa 2000 ký tự")
        String imageUrl,

        @Positive(message = "Sức chứa phải lớn hơn 0")
        Integer capacity,

        @NotNull(message = "Giá cơ bản không được để trống")
        @DecimalMin(value = "0.0", message = "Giá cơ bản không được âm")
        @Digits(integer = 12, fraction = 2, message = "Giá cơ bản không hợp lệ")
        BigDecimal basePrice
) {
}
