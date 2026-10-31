package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.dto.request.CreateBookingRequest;
import com.court.backend.dto.response.BookingResponse;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.entity.Booking;
import com.court.backend.entity.BookingPolicy;
import com.court.backend.entity.FieldPriceRule;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.BookingStatus;
import com.court.backend.enums.FieldStatus;
import com.court.backend.enums.UserRole;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingPolicyRepository;
import com.court.backend.repository.BookingRepository;
import com.court.backend.repository.FieldBlockRepository;
import com.court.backend.repository.FieldPriceRuleRepository;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int MAX_ADVANCE_DAYS = 60;
    private static final int MAX_BOOKING_HOURS = 4;
    private static final int MAX_PENDING_PER_USER = 3;
    private static final BigDecimal DEFAULT_DEPOSIT_PERCENTAGE = new BigDecimal("30");
    private static final int DEFAULT_PAYMENT_TIMEOUT_MINUTES = 15;
    private static final int MAX_PAGE_SIZE = 50;
    private static final List<BookingStatus> BLOCKING_STATUSES =
            List.of(BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED);
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyMMdd");

    private final SecureRandom random = new SecureRandom();

    @PersistenceContext
    private EntityManager entityManager;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final SportsFieldRepository sportsFieldRepository;
    private final FieldPriceRuleRepository priceRuleRepository;
    private final FieldBlockRepository fieldBlockRepository;
    private final BookingPolicyRepository bookingPolicyRepository;
    private final PricingService pricingService;

    @Transactional
    public BookingResponse create(Long userId, CreateBookingRequest request) {
        User user = getActiveCustomer(userId);
        SportsField field = findBookableField(request.fieldId());
        Venue venue = field.getVenue();

        LocalTime start = request.startTime();
        LocalTime end = request.endTime();
        validateTimes(request.date(), start, end, venue);

        Instant startAt = toInstant(request.date(), start);
        Instant endAt = toInstant(request.date(), end);
        if (!startAt.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ bắt đầu phải ở tương lai");
        }

        // Nhả các đơn đã quá hạn trước khi kiểm tra trùng lịch
        releaseExpiredBookings();

        List<Booking> overlapping = bookingRepository
                .findByFieldIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
                        field.getId(), BLOCKING_STATUSES, endAt, startAt);
        if (!overlapping.isEmpty()) {
            // Cùng người, cùng khung giờ, đơn còn đang chờ thanh toán: coi là bấm lặp, trả lại đơn cũ
            Optional<Booking> sameRequest = overlapping.stream()
                    .filter(b -> isSameRequest(b, userId, startAt, endAt))
                    .findFirst();
            if (sameRequest.isPresent()) {
                return BookingResponse.from(sameRequest.get());
            }
            throw new ApiException(HttpStatus.CONFLICT, "Khung giờ này đã có người đặt");
        }

        if (!fieldBlockRepository
                .findByFieldIdAndActiveTrueAndStartAtLessThanAndEndAtGreaterThan(field.getId(), endAt, startAt)
                .isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Khung giờ này không khả dụng (sân bị khóa)");
        }

        if (bookingRepository.countByUserIdAndStatus(userId, BookingStatus.PENDING_PAYMENT) >= MAX_PENDING_PER_USER) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Bạn đang có quá nhiều đơn chờ thanh toán, hãy thanh toán hoặc chờ hết hạn rồi đặt tiếp");
        }

        // Giá và tiền cọc do backend tính, không tin số tiền từ ứng dụng
        BigDecimal total = calculateTotal(field, request.date(), start, end);
        Optional<BookingPolicy> policy = bookingPolicyRepository.findByVenueId(venue.getId());
        BigDecimal depositPercentage = policy.map(BookingPolicy::getDepositPercentage)
                .orElse(DEFAULT_DEPOSIT_PERCENTAGE);
        int timeoutMinutes = policy.map(BookingPolicy::getPaymentTimeoutMinutes)
                .orElse(DEFAULT_PAYMENT_TIMEOUT_MINUTES);

        BigDecimal deposit = total.multiply(depositPercentage)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        if (deposit.compareTo(total) > 0) {
            deposit = total;
        }

        Booking booking = new Booking();
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setField(field);
        booking.setStartAt(startAt);
        booking.setEndAt(endAt);
        booking.setTotalAmount(total);
        booking.setDepositAmount(deposit);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setCustomerNote(blankToNull(request.note()));
        booking.setExpiresAt(Instant.now().plus(timeoutMinutes, ChronoUnit.MINUTES));

        try {
            booking = bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException e) {
            // Hai người đặt cùng lúc: ràng buộc trong database chỉ cho một người thành công
            throw new ApiException(HttpStatus.CONFLICT,
                    "Khung giờ vừa có người khác đặt, vui lòng chọn khung giờ khác");
        }
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> listMine(Long userId, BookingStatus status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "startAt").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<Booking> result = status == null
                ? bookingRepository.findByUserId(userId, pageable)
                : bookingRepository.findByUserIdAndStatus(userId, status, pageable);
        return PageResponse.from(result.map(BookingResponse::from));
    }

    @Transactional(readOnly = true)
    public BookingResponse getMine(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));
        return BookingResponse.from(booking);
    }

    // Hủy các đơn chờ thanh toán đã quá hạn giữ chỗ; do bộ lập lịch gọi định kỳ và cũng được gọi khi tạo đơn mới
    @Transactional
    public int releaseExpiredBookings() {
        Instant now = Instant.now();
        List<Booking> candidates = bookingRepository
                .findByStatusAndExpiresAtBefore(BookingStatus.PENDING_PAYMENT, now);

        int released = 0;
        for (Booking booking : candidates) {
            // Khóa dòng và đọc lại trạng thái mới nhất: không ghi đè lên đơn vừa được thanh toán xong
            entityManager.refresh(booking, LockModeType.PESSIMISTIC_WRITE);
            if (booking.getStatus() == BookingStatus.PENDING_PAYMENT
                    && booking.getExpiresAt() != null
                    && booking.getExpiresAt().isBefore(now)) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setCancelledAt(now);
                booking.setCancellationReason("Hết hạn thanh toán");
                released++;
            }
        }
        bookingRepository.flush();
        return released;
    }

    private User getActiveCustomer(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }
        if (user.getRole() != UserRole.USER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ tài khoản người dùng mới được đặt sân");
        }
        return user;
    }

    private SportsField findBookableField(Long fieldId) {
        SportsField field = sportsFieldRepository.findById(fieldId)
                .filter(f -> f.getStatus() != FieldStatus.INACTIVE
                        && f.getVenue().getStatus() == VenueStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy sân"));
        if (field.getStatus() != FieldStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sân đang bảo trì, hiện không nhận đặt");
        }
        return field;
    }

    private void validateTimes(LocalDate date, LocalTime start, LocalTime end, Venue venue) {
        if (!isWholeHour(start) || !isWholeHour(end)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ đặt phải là giờ chẵn (ví dụ 18:00)");
        }
        if (!start.isBefore(end)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ bắt đầu phải trước giờ kết thúc");
        }
        if (end.getHour() - start.getHour() > MAX_BOOKING_HOURS) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Mỗi lần đặt tối đa " + MAX_BOOKING_HOURS + " giờ");
        }
        if (start.isBefore(venue.getOpeningTime()) || end.isAfter(venue.getClosingTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Giờ đặt nằm ngoài giờ hoạt động của địa điểm ("
                            + venue.getOpeningTime() + " đến " + venue.getClosingTime() + ")");
        }
        LocalDate today = LocalDate.now(AppTime.ZONE);
        if (date.isBefore(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đặt sân cho ngày đã qua");
        }
        if (date.isAfter(today.plusDays(MAX_ADVANCE_DAYS))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Chỉ đặt được trong " + MAX_ADVANCE_DAYS + " ngày tới");
        }
    }

    private BigDecimal calculateTotal(SportsField field, LocalDate date, LocalTime start, LocalTime end) {
        List<FieldPriceRule> rules = priceRuleRepository.findByFieldIdAndActiveTrue(field.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (int hour = start.getHour(); hour < end.getHour(); hour++) {
            total = total.add(pricingService.priceForSlot(
                    field.getBasePrice(), rules, date, LocalTime.of(hour, 0)));
        }
        return total;
    }

    private boolean isSameRequest(Booking booking, Long userId, Instant startAt, Instant endAt) {
        return booking.getStatus() == BookingStatus.PENDING_PAYMENT
                && booking.getUser().getId().equals(userId)
                && booking.getStartAt().equals(startAt)
                && booking.getEndAt().equals(endAt);
    }

    private String generateBookingCode() {
        String datePart = LocalDate.now(AppTime.ZONE).format(CODE_DATE);
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder randomPart = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                randomPart.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            }
            String code = "BK" + datePart + "-" + randomPart;
            if (!bookingRepository.existsByBookingCode(code)) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tạo được mã đặt sân, vui lòng thử lại");
    }

    private Instant toInstant(LocalDate date, LocalTime time) {
        return date.atTime(time).atZone(AppTime.ZONE).toInstant();
    }

    private boolean isWholeHour(LocalTime time) {
        return time.getMinute() == 0 && time.getSecond() == 0 && time.getNano() == 0;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}