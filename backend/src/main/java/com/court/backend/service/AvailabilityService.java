package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.response.AvailabilityResponse;
import com.court.backend.dto.response.SlotResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.FieldBlock;
import com.court.backend.entity.FieldPriceRule;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.Venue;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.FieldStatus;
import com.court.backend.enums.SlotStatus;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.FieldBlockRepository;
import com.court.backend.repository.FieldPriceRuleRepository;
import com.court.backend.repository.SportsFieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private static final int MAX_ADVANCE_DAYS = 60;
    // Đơn đang giữ chỗ hoặc đã xác nhận thì chiếm khung giờ
    private static final List<BookingStatus> BLOCKING_STATUSES =
            List.of(BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED);

    private final SportsFieldRepository sportsFieldRepository;
    private final FieldPriceRuleRepository priceRuleRepository;
    private final BookingRepository bookingRepository;
    private final FieldBlockRepository fieldBlockRepository;
    private final PricingService pricingService;

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long fieldId, LocalDate date) {
        SportsField field = sportsFieldRepository.findById(fieldId)
                .filter(f -> f.getStatus() != FieldStatus.INACTIVE
                        && f.getVenue().getStatus() == VenueStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy sân"));
        Venue venue = field.getVenue();

        ZonedDateTime now = ZonedDateTime.now(AppTime.ZONE);
        LocalDate today = now.toLocalDate();
        if (date.isBefore(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể xem lịch của ngày đã qua");
        }
        if (date.isAfter(today.plusDays(MAX_ADVANCE_DAYS))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ xem được lịch trong " + MAX_ADVANCE_DAYS + " ngày tới");
        }

        boolean fieldActive = field.getStatus() == FieldStatus.ACTIVE;

        // Ô giờ chẵn nằm trọn trong giờ mở cửa: từ giờ mở (làm tròn lên) đến giờ đóng (làm tròn xuống)
        LocalTime opening = venue.getOpeningTime();
        boolean openingIsWholeHour = opening.getMinute() == 0 && opening.getSecond() == 0 && opening.getNano() == 0;
        int firstHour = openingIsWholeHour ? opening.getHour() : opening.getHour() + 1;
        int closeHour = venue.getClosingTime().getHour();

        List<FieldPriceRule> rules = priceRuleRepository.findByFieldIdAndActiveTrue(fieldId);
        List<Booking> bookings = List.of();
        List<FieldBlock> blocks = List.of();

        if (fieldActive && firstHour < closeHour) {
            Instant windowStart = toInstant(date, LocalTime.of(firstHour, 0));
            Instant windowEnd = toInstant(date, LocalTime.of(closeHour, 0));
            bookings = bookingRepository.findByFieldIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
                    fieldId, BLOCKING_STATUSES, windowEnd, windowStart);
            blocks = fieldBlockRepository.findByFieldIdAndActiveTrueAndStartAtLessThanAndEndAtGreaterThan(
                    fieldId, windowEnd, windowStart);
        }

        List<SlotResponse> slots = new ArrayList<>();
        for (int hour = firstHour; hour < closeHour; hour++) {
            LocalTime start = LocalTime.of(hour, 0);
            LocalTime end = LocalTime.of(hour + 1, 0);
            Instant slotStart = toInstant(date, start);
            Instant slotEnd = toInstant(date, end);

            SlotStatus status;
            if (!fieldActive) {
                status = SlotStatus.BLOCKED;
            } else if (slotStart.isBefore(now.toInstant())) {
                status = SlotStatus.PAST;
            } else if (overlapsBooking(bookings, slotStart, slotEnd)) {
                status = SlotStatus.BOOKED;
            } else if (overlapsBlock(blocks, slotStart, slotEnd)) {
                status = SlotStatus.BLOCKED;
            } else {
                status = SlotStatus.AVAILABLE;
            }

            slots.add(new SlotResponse(
                    start,
                    end,
                    pricingService.priceForSlot(field.getBasePrice(), rules, date, start),
                    status.name()));
        }

        return new AvailabilityResponse(
                field.getId(),
                field.getName(),
                field.getSportType(),
                venue.getId(),
                venue.getName(),
                date,
                field.getStatus().name(),
                fieldActive,
                slots);
    }

    private Instant toInstant(LocalDate date, LocalTime time) {
        return date.atTime(time).atZone(AppTime.ZONE).toInstant();
    }

    private boolean overlapsBooking(List<Booking> bookings, Instant slotStart, Instant slotEnd) {
        return bookings.stream()
                .anyMatch(b -> b.getStartAt().isBefore(slotEnd) && b.getEndAt().isAfter(slotStart));
    }

    private boolean overlapsBlock(List<FieldBlock> blocks, Instant slotStart, Instant slotEnd) {
        return blocks.stream()
                .anyMatch(b -> b.getStartAt().isBefore(slotEnd) && b.getEndAt().isAfter(slotStart));
    }
}
