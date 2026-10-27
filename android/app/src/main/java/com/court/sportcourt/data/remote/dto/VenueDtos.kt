package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class SportTypeDto(
    val code: String,
    val label: String
)

@Serializable
data class FieldDto(
    val id: Long,
    val venueId: Long? = null,
    val name: String,
    val sportType: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val capacity: Int? = null,
    val basePrice: Double = 0.0,
    val status: String = "ACTIVE"
) {
    // SỬA: backend không trả trường này cho danh sách sân, tự tính từ status (không đưa vào JSON)
    val bookable: Boolean get() = status == "ACTIVE"
}

// THÊM: khớp đối tượng "policy" của API chi tiết địa điểm
@Serializable
data class PolicyDto(
    val depositPercentage: Double = 30.0,
    val cancellationDeadlineHours: Int = 24,
    val depositRefundableOnCustomerCancel: Boolean = false,
    val fullPaymentRefundableBeforeDeadline: Boolean = true,
    val ownerCancellationFullRefund: Boolean = true,
    val paymentTimeoutMinutes: Int = 15
)

@Serializable
data class VenueResponse(
    val id: Long,
    val ownerId: Long? = null,
    val name: String,
    val address: String,
    val city: String? = null,
    val district: String? = null, // SỬA: cho phép rỗng
    val description: String? = null,
    val phone: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val status: String = "ACTIVE",
    val sportTypes: List<String> = emptyList(),
    val fieldCount: Int? = null,
    val minBasePrice: Double? = null, // SỬA: null nghĩa là chưa có sân đang hoạt động
    val policy: PolicyDto? = null, // THÊM: thay cho depositPolicy và cancellationPolicy
    val fields: List<FieldDto> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class PageResponse<T>(
    val content: List<T> = emptyList(),
    val page: Int = 0,
    val size: Int = 10,
    val totalElements: Long = 0,
    val totalPages: Int = 0
) {
    val last: Boolean get() = page >= totalPages - 1 || totalPages <= 1
}

@Serializable
data class TimeSlotDto(
    val startTime: String,
    val endTime: String,
    val price: Double,
    val status: String
)

@Serializable
data class FieldAvailabilityResponse(
    val fieldId: Long = 0L,
    val fieldName: String? = null,
    val sportType: String? = null,
    val venueId: Long? = null,
    val venueName: String? = null,
    val date: String = "",
    val fieldStatus: String? = null,
    val bookable: Boolean = true,
    val slots: List<TimeSlotDto> = emptyList()
) {
    val timeSlots: List<TimeSlotDto> get() = slots
}