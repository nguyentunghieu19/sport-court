package com.court.backend.repository;

import com.court.backend.entity.Booking;
import com.court.backend.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Các đơn của sân chồng lên khoảng [windowStart, windowEnd): bắt đầu trước windowEnd và kết thúc sau windowStart
    List<Booking> findByFieldIdAndStatusInAndStartAtLessThanAndEndAtGreaterThan(
            Long fieldId, Collection<BookingStatus> statuses, Instant windowEnd, Instant windowStart);
}