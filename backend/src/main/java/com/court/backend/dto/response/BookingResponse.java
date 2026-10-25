package com.court.backend.dto.response;

import com.court.backend.config.AppTime;
import com.court.backend.entity.Booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;

public record BookingResponse(
        Long id,
        String bookingCode,
        Long fieldId,
        String fieldName,
        String sportType,
        Long venueId,
        String venueName,
        String venueAddress,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        Instant startAt,
        Instant endAt,
        BigDecimal totalAmount,
        BigDecimal depositAmount,
        BigDecimal remainingAfterDeposit,
        String status,
        String customerNote,
        Instant expiresAt,
        Instant cancelledAt,
        String cancellationReason,
        Instant createdAt
) {

    public static BookingResponse from(Booking booking) {
        ZonedDateTime start = booking.getStartAt().atZone(AppTime.ZONE);
        ZonedDateTime end = booking.getEndAt().atZone(AppTime.ZONE);

        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getField().getId(),
                booking.getField().getName(),
                booking.getField().getSportType(),
                booking.getField().getVenue().getId(),
                booking.getField().getVenue().getName(),
                booking.getField().getVenue().getAddress(),
                start.toLocalDate(),
                start.toLocalTime(),
                end.toLocalTime(),
                booking.getStartAt(),
                booking.getEndAt(),
                booking.getTotalAmount(),
                booking.getDepositAmount(),
                booking.getTotalAmount().subtract(booking.getDepositAmount()),
                booking.getStatus().name(),
                booking.getCustomerNote(),
                booking.getExpiresAt(),
                booking.getCancelledAt(),
                booking.getCancellationReason(),
                booking.getCreatedAt());
    }
}