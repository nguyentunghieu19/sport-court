package com.court.backend.dto.response;

import com.court.backend.entity.BookingPolicy;

import java.math.BigDecimal;

public record PolicyResponse(
        BigDecimal depositPercentage,
        Integer cancellationDeadlineHours,
        boolean depositRefundableOnCustomerCancel,
        boolean fullPaymentRefundableBeforeDeadline,
        boolean ownerCancellationFullRefund,
        Integer paymentTimeoutMinutes
) {

    public static PolicyResponse from(BookingPolicy policy) {
        return new PolicyResponse(
                policy.getDepositPercentage(),
                policy.getCancellationDeadlineHours(),
                policy.isDepositRefundableOnCustomerCancel(),
                policy.isFullPaymentRefundableBeforeDeadline(),
                policy.isOwnerCancellationFullRefund(),
                policy.getPaymentTimeoutMinutes());
    }
}