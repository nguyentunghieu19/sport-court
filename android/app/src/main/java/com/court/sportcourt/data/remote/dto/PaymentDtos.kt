package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class CreatePaymentRequest(
    val bookingId: Long,
    val paymentType: String // "DEPOSIT" hoặc "FULL"
)

@Serializable
data class PaymentUrlResponse(
    val paymentId: Long,
    val bookingId: Long,
    val bookingCode: String? = null,
    val paymentType: String,
    val amount: Double,
    val paymentUrl: String,
    val expiresAt: String? = null
)

@Serializable
data class PaymentResponse(
    val id: Long,
    val bookingId: Long? = null,
    val bookingCode: String? = null,
    val bookingStatus: String? = null,
    val paymentType: String? = null,
    val method: String? = null,
    val provider: String? = null,
    val providerTransactionId: String? = null,
    val amount: Double = 0.0,
    val status: String = "PENDING", // "SUCCEEDED", "FAILED", "PENDING"
    val paidAt: String? = null,
    val failureReason: String? = null,
    val createdAt: String? = null
)

@Serializable
data class RefundResponse(
    val id: Long,
    val paymentId: Long? = null,
    val bookingId: Long? = null,
    val bookingCode: String? = null,
    val amount: Double = 0.0,
    val reason: String? = null,
    val status: String = "PENDING", // "PENDING", "SUCCEEDED", "REJECTED"
    val referenceNote: String? = null,
    val requestedAt: String? = null,
    val completedAt: String? = null
)
