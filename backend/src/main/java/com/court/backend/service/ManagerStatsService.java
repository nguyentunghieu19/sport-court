package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.response.ManagerStatsResponse;
import com.court.backend.dto.response.ManagerStatsResponse.DailyRevenuePoint;
import com.court.backend.dto.response.ManagerStatsResponse.HourStatPoint;
import com.court.backend.dto.response.ManagerStatsResponse.MonthlyRevenuePoint;
import com.court.backend.dto.response.ManagerStatsResponse.PaymentMethodStatPoint;
import com.court.backend.dto.response.ManagerStatsResponse.SportStatPoint;
import com.court.backend.dto.response.ManagerStatsResponse.TopFieldPoint;
import com.court.backend.entity.Booking;
import com.court.backend.entity.Payment;
import com.court.backend.entity.Refund;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.FieldStatus;
import com.court.backend.enums.PaymentStatus;
import com.court.backend.enums.RefundStatus;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.PaymentRepository;
import com.court.backend.repository.RefundRepository;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerStatsService {

    private static final List<PaymentStatus> SUCCESS_PAYMENT_STATUSES =
            List.of(PaymentStatus.SUCCEEDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED);

    private final VenueRepository venueRepository;
    private final SportsFieldRepository sportsFieldRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final ManagerAccessService managerAccessService;

    @Transactional(readOnly = true)
    public ManagerStatsResponse getStats(Long managerId, Long venueId) {
        User manager = managerAccessService.requireManager(managerId);
        List<Long> manageableVenueIds = managerAccessService.manageableVenueIds(manager);

        if (venueId != null) {
            if (!manageableVenueIds.contains(venueId)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm");
            }
            manageableVenueIds = List.of(venueId);
        }

        if (manageableVenueIds.isEmpty()) {
            return emptyResponse();
        }

        // 1. Lấy dữ liệu cơ sở vật chất
        List<Venue> venues = venueRepository.findAllById(manageableVenueIds);
        int totalVenues = venues.size();
        int activeVenues = (int) venues.stream().filter(v -> v.getStatus() == VenueStatus.ACTIVE).count();
        int inactiveVenues = totalVenues - activeVenues;

        List<SportsField> fields = sportsFieldRepository.findByVenueIdIn(manageableVenueIds);
        int totalFields = fields.size();
        int activeFields = (int) fields.stream().filter(f -> f.getStatus() == FieldStatus.ACTIVE).count();
        int maintenanceFields = (int) fields.stream().filter(f -> f.getStatus() == FieldStatus.MAINTENANCE).count();
        int inactiveFields = (int) fields.stream().filter(f -> f.getStatus() == FieldStatus.INACTIVE).count();

        // 2. Lấy dữ liệu đơn đặt sân
        List<Booking> bookings = bookingRepository.findByFieldVenueIdIn(manageableVenueIds);
        int totalBookings = bookings.size();
        int confirmedBookings = (int) bookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();
        int pendingBookings = (int) bookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING_PAYMENT).count();
        int completedBookings = (int) bookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        int cancelledBookings = (int) bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

        int successfulBookings = confirmedBookings + completedBookings;
        double completionRate = totalBookings > 0
                ? Math.round((successfulBookings * 100.0 / totalBookings) * 10.0) / 10.0
                : 0.0;
        double cancellationRate = totalBookings > 0
                ? Math.round((cancelledBookings * 100.0 / totalBookings) * 10.0) / 10.0
                : 0.0;

        // 3. Lấy dữ liệu thanh toán & hoàn tiền
        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        List<Payment> payments = bookingIds.isEmpty()
                ? List.of()
                : paymentRepository.findByBookingIdInAndStatusIn(bookingIds, SUCCESS_PAYMENT_STATUSES);

        List<Long> paymentIds = payments.stream().map(Payment::getId).toList();
        List<Refund> refunds = paymentIds.isEmpty()
                ? List.of()
                : refundRepository.findByPaymentIdIn(paymentIds);

        BigDecimal totalRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDeposit = bookings.stream()
                .map(b -> b.getDepositAmount() != null ? b.getDepositAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRefunded = refunds.stream()
                .filter(r -> r.getStatus() == RefundStatus.SUCCEEDED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = totalRevenue.subtract(totalRefunded).max(BigDecimal.ZERO);

        BigDecimal avgOrderValue = successfulBookings > 0
                ? totalRevenue.divide(BigDecimal.valueOf(successfulBookings), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 4. Biểu đồ doanh thu 7 ngày gần nhất
        LocalDate today = LocalDate.now(AppTime.ZONE);
        List<DailyRevenuePoint> last7DaysRevenue = new ArrayList<>();
        DateTimeFormatter dayMonthFormatter = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dateLabel = d.format(dayMonthFormatter);
            String dayOfWeek = formatDayOfWeek(d.getDayOfWeek());

            BigDecimal dayRev = payments.stream()
                    .filter(p -> p.getPaidAt() != null)
                    .filter(p -> p.getPaidAt().atZone(AppTime.ZONE).toLocalDate().equals(d))
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int dayBookings = (int) bookings.stream()
                    .filter(b -> b.getStartAt() != null)
                    .filter(b -> b.getStartAt().atZone(AppTime.ZONE).toLocalDate().equals(d))
                    .count();

            last7DaysRevenue.add(new DailyRevenuePoint(dateLabel, dayOfWeek, dayRev, dayBookings));
        }

        // 5. Biểu đồ doanh thu 12 tháng của năm hiện tại
        int currentYear = today.getYear();
        List<MonthlyRevenuePoint> monthlyRevenue = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            final int monthIndex = m;
            BigDecimal monthRev = payments.stream()
                    .filter(p -> p.getPaidAt() != null)
                    .filter(p -> {
                        ZonedDateTime zdt = p.getPaidAt().atZone(AppTime.ZONE);
                        return zdt.getYear() == currentYear && zdt.getMonthValue() == monthIndex;
                    })
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int monthBookings = (int) bookings.stream()
                    .filter(b -> b.getStartAt() != null)
                    .filter(b -> {
                        ZonedDateTime zdt = b.getStartAt().atZone(AppTime.ZONE);
                        return zdt.getYear() == currentYear && zdt.getMonthValue() == monthIndex;
                    })
                    .count();

            monthlyRevenue.add(new MonthlyRevenuePoint("Thg " + m, currentYear, monthRev, monthBookings));
        }

        // 6. Phân tích theo bộ môn thể thao
        Map<String, List<SportsField>> fieldsBySport = fields.stream()
                .collect(Collectors.groupingBy(f -> f.getSportType().toUpperCase()));

        Map<String, List<Booking>> bookingsBySport = bookings.stream()
                .filter(b -> b.getField() != null && b.getField().getSportType() != null)
                .collect(Collectors.groupingBy(b -> b.getField().getSportType().toUpperCase()));

        Map<Long, BigDecimal> revenueByBookingId = payments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getBooking().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        Set<String> allSports = fieldsBySport.keySet();
        List<SportStatPoint> sportBreakdown = new ArrayList<>();
        for (String sport : allSports) {
            int fieldCount = fieldsBySport.getOrDefault(sport, List.of()).size();
            List<Booking> sportBookings = bookingsBySport.getOrDefault(sport, List.of());
            int sportBookingsCount = sportBookings.size();

            BigDecimal sportRev = sportBookings.stream()
                    .map(b -> revenueByBookingId.getOrDefault(b.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? sportRev.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            sportBreakdown.add(new SportStatPoint(
                    sport,
                    formatSportLabel(sport),
                    fieldCount,
                    sportBookingsCount,
                    sportRev,
                    pct
            ));
        }
        sportBreakdown.sort(Comparator.comparing(SportStatPoint::revenue).reversed());

        // 7. Khung giờ đặt sân cao điểm
        Map<String, Integer> hourSlots = new LinkedHashMap<>();
        hourSlots.put("05:00 - 08:00 (Sáng sớm)", 0);
        hourSlots.put("08:00 - 11:30 (Buổi sáng)", 0);
        hourSlots.put("11:30 - 14:00 (Buổi trưa)", 0);
        hourSlots.put("14:00 - 17:30 (Buổi chiều)", 0);
        hourSlots.put("17:30 - 20:30 (Giờ vàng tối)", 0);
        hourSlots.put("20:30 - 23:30 (Đêm muộn)", 0);

        for (Booking b : bookings) {
            if (b.getStartAt() == null) continue;
            int hour = b.getStartAt().atZone(AppTime.ZONE).getHour();
            int minute = b.getStartAt().atZone(AppTime.ZONE).getMinute();
            int totalMinutes = hour * 60 + minute;

            if (totalMinutes >= 5 * 60 && totalMinutes < 8 * 60) {
                hourSlots.computeIfPresent("05:00 - 08:00 (Sáng sớm)", (k, v) -> v + 1);
            } else if (totalMinutes >= 8 * 60 && totalMinutes < 11 * 60 + 30) {
                hourSlots.computeIfPresent("08:00 - 11:30 (Buổi sáng)", (k, v) -> v + 1);
            } else if (totalMinutes >= 11 * 60 + 30 && totalMinutes < 14 * 60) {
                hourSlots.computeIfPresent("11:30 - 14:00 (Buổi trưa)", (k, v) -> v + 1);
            } else if (totalMinutes >= 14 * 60 && totalMinutes < 17 * 60 + 30) {
                hourSlots.computeIfPresent("14:00 - 17:30 (Buổi chiều)", (k, v) -> v + 1);
            } else if (totalMinutes >= 17 * 60 + 30 && totalMinutes < 20 * 60 + 30) {
                hourSlots.computeIfPresent("17:30 - 20:30 (Giờ vàng tối)", (k, v) -> v + 1);
            } else {
                hourSlots.computeIfPresent("20:30 - 23:30 (Đêm muộn)", (k, v) -> v + 1);
            }
        }

        List<HourStatPoint> peakHoursBreakdown = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : hourSlots.entrySet()) {
            double pct = totalBookings > 0
                    ? Math.round((entry.getValue() * 100.0 / totalBookings) * 10.0) / 10.0
                    : 0.0;
            peakHoursBreakdown.add(new HourStatPoint(entry.getKey(), entry.getValue(), pct));
        }

        // 8. Top sân con hiệu quả nhất
        Map<Long, List<Booking>> bookingsByField = bookings.stream()
                .filter(b -> b.getField() != null)
                .collect(Collectors.groupingBy(b -> b.getField().getId()));

        List<TopFieldPoint> topFields = new ArrayList<>();
        for (SportsField f : fields) {
            List<Booking> fBookings = bookingsByField.getOrDefault(f.getId(), List.of());
            int fBookingsCount = fBookings.size();
            BigDecimal fRev = fBookings.stream()
                    .map(b -> revenueByBookingId.getOrDefault(b.getId(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            topFields.add(new TopFieldPoint(
                    f.getId(),
                    f.getName(),
                    f.getVenue().getName(),
                    formatSportLabel(f.getSportType()),
                    fBookingsCount,
                    fRev
            ));
        }
        topFields.sort(Comparator.comparing(TopFieldPoint::revenue).reversed()
                .thenComparing(Comparator.comparing(TopFieldPoint::bookingsCount).reversed()));
        if (topFields.size() > 5) {
            topFields = topFields.subList(0, 5);
        }

        // 9. Phân loại phương thức thanh toán
        Map<String, BigDecimal> amountByMethod = new HashMap<>();
        Map<String, Integer> countByMethod = new HashMap<>();
        for (Payment p : payments) {
            String mName = p.getMethod() != null ? p.getMethod().name() : "OTHER";
            amountByMethod.merge(mName, p.getAmount(), BigDecimal::add);
            countByMethod.merge(mName, 1, Integer::sum);
        }

        List<PaymentMethodStatPoint> paymentMethodBreakdown = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : amountByMethod.entrySet()) {
            String methodKey = entry.getKey();
            BigDecimal amount = entry.getValue();
            int count = countByMethod.getOrDefault(methodKey, 0);
            double pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            paymentMethodBreakdown.add(new PaymentMethodStatPoint(
                    methodKey,
                    formatPaymentMethod(methodKey),
                    amount,
                    count,
                    pct
            ));
        }
        paymentMethodBreakdown.sort(Comparator.comparing(PaymentMethodStatPoint::amount).reversed());

        return new ManagerStatsResponse(
                totalVenues,
                activeVenues,
                inactiveVenues,
                totalFields,
                activeFields,
                maintenanceFields,
                inactiveFields,
                totalBookings,
                confirmedBookings,
                pendingBookings,
                completedBookings,
                cancelledBookings,
                completionRate,
                cancellationRate,
                totalRevenue,
                totalDeposit,
                totalRefunded,
                netRevenue,
                avgOrderValue,
                last7DaysRevenue,
                monthlyRevenue,
                sportBreakdown,
                peakHoursBreakdown,
                topFields,
                paymentMethodBreakdown
        );
    }

    private ManagerStatsResponse emptyResponse() {
        return new ManagerStatsResponse(
                0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0.0, 0.0,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );
    }

    private String formatDayOfWeek(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }

    private String formatSportLabel(String sport) {
        if (sport == null) return "Khác";
        return switch (sport.toUpperCase()) {
            case "FOOTBALL" -> "Bóng đá";
            case "BADMINTON" -> "Cầu lông";
            case "PICKLEBALL" -> "Pickleball";
            case "TENNIS" -> "Tennis";
            case "BASKETBALL" -> "Bóng rổ";
            case "VOLLEYBALL" -> "Bóng chuyền";
            case "TABLE_TENNIS" -> "Bóng bàn";
            default -> sport;
        };
    }

    private String formatPaymentMethod(String method) {
        if (method == null) return "Khác";
        return switch (method.toUpperCase()) {
            case "GATEWAY" -> "Cổng trực tuyến (VNPay)";
            case "TRANSFER" -> "Chuyển khoản ngân hàng";
            case "CASH" -> "Tiền mặt tại quầy";
            default -> method;
        };
    }
}

