package com.court.backend.repository;

import com.court.backend.entity.Refund;
import com.court.backend.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByPaymentIdIn(Collection<Long> paymentIds);

    // Danh sách cho người quản lý: các yêu cầu thuộc những địa điểm được phép
    @EntityGraph(attributePaths = {"payment", "payment.booking", "payment.booking.user",
            "payment.booking.field", "payment.booking.field.venue", "requestedBy", "processedBy"})
    Page<Refund> findByPaymentBookingFieldVenueIdIn(Collection<Long> venueIds, Pageable pageable);

    @EntityGraph(attributePaths = {"payment", "payment.booking", "payment.booking.user",
            "payment.booking.field", "payment.booking.field.venue", "requestedBy", "processedBy"})
    Page<Refund> findByPaymentBookingFieldVenueIdInAndStatus(
            Collection<Long> venueIds, RefundStatus status, Pageable pageable);

    // Danh sách cho khách
    @EntityGraph(attributePaths = {"payment", "payment.booking"})
    Page<Refund> findByPaymentBookingUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"payment", "payment.booking"})
    Page<Refund> findByPaymentBookingUserIdAndPaymentBookingId(Long userId, Long bookingId, Pageable pageable);
}