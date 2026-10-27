package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class BookingRequest(
    val fieldId: Long,
    val date: String,
    val startTime: String,
    val endTime: String,
    val note: String? = null
)

@Serializable
data class BookingResponse(
    val id: Long,
    val bookingCode: String,
    val fieldId: Long? = null,
    val fieldName: String? = null,
    val sportType: String? = null,
    val venueId: Long? = null,
    val venueName: String? = null,
    val venueAddress: String? = null,
    val date: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val startAt: String? = null,
    val endAt: String? = null,
    val totalAmount: Double = 0.0,
    val depositAmount: Double = 0.0,
    val remainingAfterDeposit: Double = 0.0,
    val status: String = "PENDING_PAYMENT",
    val customerNote: String? = null,
    val expiresAt: String? = null,
    val cancelledAt: String? = null,
    val cancellationReason: String? = null,
    val createdAt: String? = null
) {
    val note: String? get() = customerNote
}
