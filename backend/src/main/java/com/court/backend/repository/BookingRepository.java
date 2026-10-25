package com.court.backend.repository;

import com.court.backend.entity.Booking;
import com.court.backend.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Các đơn của sân chồng lên khoảng [windowStart, windowEnd): bắt đầu trước windowEnd và kết thúc sau windowStart
    List<Booking> findByFieldIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
            Long fieldId, Collection<BookingStatus> statuses, Instant windowEnd, Instant windowStart);

    // Đơn chờ thanh toán đã quá hạn giữ chỗ
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, Instant instant);

    long countByUserIdAndStatus(Long userId, BookingStatus status);

    boolean existsByBookingCode(String bookingCode);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Page<Booking> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Page<Booking> findByUserIdAndStatus(Long userId, BookingStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Optional<Booking> findByIdAndUserId(Long id, Long userId);
}