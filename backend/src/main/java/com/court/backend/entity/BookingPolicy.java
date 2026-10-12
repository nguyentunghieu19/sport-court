package com.court.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "booking_policies")
public class BookingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venue_id", nullable = false, unique = true)
    private Venue venue;

    @Column(name = "deposit_percentage", nullable = false)
    private BigDecimal depositPercentage = new BigDecimal("30.00");

    @Column(name = "cancellation_deadline_hours", nullable = false)
    private Integer cancellationDeadlineHours = 24;

    @Column(name = "deposit_refundable_on_customer_cancel", nullable = false)
    private boolean depositRefundableOnCustomerCancel = false;

    @Column(name = "full_payment_refundable_before_deadline", nullable = false)
    private boolean fullPaymentRefundableBeforeDeadline = true;

    @Column(name = "owner_cancellation_full_refund", nullable = false)
    private boolean ownerCancellationFullRefund = true;

    @Column(name = "payment_timeout_minutes", nullable = false)
    private Integer paymentTimeoutMinutes = 15;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}