package com.court.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record VenueRequest(

        @NotBlank(message = "Tên địa điểm không được để trống")
        @Size(max = 200, message = "Tên địa điểm tối đa 200 ký tự")
        String name,

        @NotBlank(message = "Địa chỉ không được để trống")
        String address,

        @NotBlank(message = "Tỉnh/thành phố không được để trống")
        @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
        String city,

        @NotBlank(message = "Quận/huyện không được để trống")
        @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
        String district,

        String description,

        @Pattern(regexp = "^(\\+84|0)\\d{9,10}$", message = "Số điện thoại không hợp lệ")
        String phone,

        @NotNull(message = "Giờ mở cửa không được để trống")
        LocalTime openingTime,

        @NotNull(message = "Giờ đóng cửa không được để trống")
        LocalTime closingTime
) {
}