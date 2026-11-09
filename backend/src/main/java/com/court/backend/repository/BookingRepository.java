package com.court.backend.repository;

import com.court.backend.entity.Booking;
import com.court.backend.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    // Các đơn của sân chồng lên khoảng [windowStart, windowEnd): bắt đầu trước windowEnd và kết thúc sau windowStart
    List<Booking> findByFieldIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
            Long fieldId, Collection<BookingStatus> statuses, Instant windowEnd, Instant windowStart);

    // Đơn chờ thanh toán đã quá hạn giữ chỗ
    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, Instant instant);

    long countByUserIdAndStatus(Long userId, BookingStatus status);

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCode(String bookingCode);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Page<Booking> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Page<Booking> findByUserIdAndStatus(Long userId, BookingStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"field", "field.venue"})
    Optional<Booking> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = {"field", "field.venue", "user"})
    List<Booking> findByFieldVenueIdIn(Collection<Long> venueIds);

    // Tìm kiếm động cho chủ sân và nhân viên, nạp sẵn các quan hệ cần hiển thị
    @Override
    @EntityGraph(attributePaths = {"field", "field.venue", "user", "cancelledBy", "checkedInBy"})
    Page<Booking> findAll(Specification<Booking> spec, Pageable pageable);
}
