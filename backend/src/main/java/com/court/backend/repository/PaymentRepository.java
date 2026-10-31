package com.court.backend.repository;

import com.court.backend.entity.Payment;
import com.court.backend.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    // Đã có giao dịch thành công khác cho cùng đơn (dùng để phát hiện thanh toán trùng)
    boolean existsByBookingIdAndStatusAndIdNot(Long bookingId, PaymentStatus status, Long id);

    @EntityGraph(attributePaths = {"booking"})
    Optional<Payment> findByIdAndBookingUserId(Long id, Long userId);

    @EntityGraph(attributePaths = {"booking"})
    Page<Payment> findByBookingUserId(Long userId, Pageable pageable);
}