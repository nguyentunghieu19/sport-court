package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ManagedVenueResponse(
    val id: Long,
    val name: String,
    val address: String? = null,
    val city: String? = null,
    val district: String? = null,
    val phone: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val status: String = "ACTIVE",
    val imageUrl: String? = null
)

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
    val cancelledByName: String? = null,
    val checkedInAt: String? = null,
    val checkedInByName: String? = null
)

@Serializable
data class ManagerCancelRequest(
    val reason: String
)

@Serializable
data class CheckInCodeRequest(
    val bookingCode: String
)

@Serializable
data class OnsitePaymentRequest(
    val method: String,
    val amount: Double,
    val idempotencyKey: String
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

@Serializable
data class DailyRevenuePoint(
    val date: String? = null,
    val dayOfWeek: String? = null,
    val revenue: Double = 0.0,
    val bookingsCount: Int = 0
)

@Serializable
data class MonthlyRevenuePoint(
    val month: String? = null,
    val year: Int = 0,
    val revenue: Double = 0.0,
    val bookingsCount: Int = 0
)

@Serializable
data class SportStatPoint(
    val sportType: String? = null,
    val sportLabel: String? = null,
    val fieldsCount: Int = 0,
    val bookingsCount: Int = 0,
    val revenue: Double = 0.0,
    val percentage: Double = 0.0
)

@Serializable
data class HourStatPoint(
    val timeSlot: String? = null,
    val bookingsCount: Int = 0,
    val percentage: Double = 0.0
)

@Serializable
data class TopFieldPoint(
    val fieldId: Long? = null,
    val fieldName: String? = null,
    val venueName: String? = null,
    val sportType: String? = null,
    val bookingsCount: Int = 0,
    val revenue: Double = 0.0
)

@Serializable
data class PaymentMethodStatPoint(
    val method: String? = null,
    val label: String? = null,
    val amount: Double = 0.0,
    val count: Int = 0,
    val percentage: Double = 0.0
)

@Serializable
data class ManagerStatsResponse(
    val totalVenues: Int = 0,
    val activeVenues: Int = 0,
    val inactiveVenues: Int = 0,
    val totalFields: Int = 0,
    val activeFields: Int = 0,
    val maintenanceFields: Int = 0,
    val inactiveFields: Int = 0,

    val totalBookings: Int = 0,
    val confirmedBookings: Int = 0,
    val pendingBookings: Int = 0,
    val completedBookings: Int = 0,
    val cancelledBookings: Int = 0,
    val completionRate: Double = 0.0,
    val cancellationRate: Double = 0.0,

    val totalRevenue: Double = 0.0,
    val totalDeposit: Double = 0.0,
    val totalRefunded: Double = 0.0,
    val netRevenue: Double = 0.0,
    val avgOrderValue: Double = 0.0,

    val last7DaysRevenue: List<DailyRevenuePoint> = emptyList(),
    val monthlyRevenue: List<MonthlyRevenuePoint> = emptyList(),

    val sportBreakdown: List<SportStatPoint> = emptyList(),
    val peakHoursBreakdown: List<HourStatPoint> = emptyList(),
    val topFields: List<TopFieldPoint> = emptyList(),
    val paymentMethodBreakdown: List<PaymentMethodStatPoint> = emptyList()
)
