package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ManagerBookingResponse(
    val booking: BookingResponse,
    val customerId: Long? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerEmail: String? = null,
    val paidAmount: Double = 0.0,
    val refundedAmount: Double = 0.0,
    val pendingRefundAmount: Double = 0.0,
    val outstandingAmount: Double = 0.0,
    val cancelledByName: String? = null
)

@Serializable
data class ManagerCancelRequest(
    val reason: String
)

@Serializable
data class ManagerRefundResponse(
    val id: Long,
    val paymentId: Long? = null,
    val paymentType: String? = null,
    val paymentMethod: String? = null,
    val bookingId: Long? = null,
    val bookingCode: String? = null,
    val venueId: Long? = null,
    val venueName: String? = null,
    val customerId: Long? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerEmail: String? = null,
    val amount: Double = 0.0,
    val reason: String? = null,
    val status: String = "PENDING",
    val referenceNote: String? = null,
    val requestedAt: String? = null,
    val requestedByName: String? = null,
    val processedAt: String? = null,
    val completedAt: String? = null,
    val processedByName: String? = null
)

@Serializable
data class ConfirmRefundRequest(
    val note: String
)
