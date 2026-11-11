package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.CancelResultResponse
import com.court.sportcourt.data.remote.dto.CheckInCodeRequest
import com.court.sportcourt.data.remote.dto.ConfirmRefundRequest
import com.court.sportcourt.data.remote.dto.FieldDto
import com.court.sportcourt.data.remote.dto.ManagedVenueResponse
import com.court.sportcourt.data.remote.dto.ManagerBookingResponse
import com.court.sportcourt.data.remote.dto.ManagerCancelRequest
import com.court.sportcourt.data.remote.dto.ManagerRefundResponse
import com.court.sportcourt.data.remote.dto.ManagerStatsResponse
import com.court.sportcourt.data.remote.dto.OnsitePaymentRequest
import com.court.sportcourt.data.remote.dto.PageResponse
import com.court.sportcourt.data.remote.dto.PaymentResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ManageApi {

    @GET("api/manage/venues")
    suspend fun getManagedVenues(): Response<List<ManagedVenueResponse>>

    @GET("api/manage/venues/{venueId}/fields")
    suspend fun getManagedFields(
        @Path("venueId") venueId: Long
    ): Response<List<FieldDto>>

    @GET("api/manage/stats")
    suspend fun getManageStats(
        @Query("venueId") venueId: Long? = null
    ): Response<ManagerStatsResponse>

    @GET("api/manage/bookings")
    suspend fun getManageBookings(
        @Query("venueId") venueId: Long? = null,
        @Query("fieldId") fieldId: Long? = null,
        @Query("date") date: String? = null,
        @Query("status") status: String? = null,
        @Query("keyword") keyword: String? = null,
        @Query("outstandingOnly") outstandingOnly: Boolean? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<PageResponse<ManagerBookingResponse>>

    @GET("api/manage/bookings/{id}")
    suspend fun getManageBookingDetail(
        @Path("id") id: Long
    ): Response<ManagerBookingResponse>

    @POST("api/manage/bookings/{id}/check-in")
    suspend fun checkInBookingById(
        @Path("id") id: Long
    ): Response<ManagerBookingResponse>

    @POST("api/manage/bookings/check-in")
    suspend fun checkInBookingByCode(
        @Body request: CheckInCodeRequest
    ): Response<ManagerBookingResponse>

    @POST("api/manage/bookings/{id}/complete")
    suspend fun completeBooking(
        @Path("id") id: Long
    ): Response<ManagerBookingResponse>

    @POST("api/manage/bookings/{id}/no-show")
    suspend fun noShowBooking(
        @Path("id") id: Long
    ): Response<ManagerBookingResponse>

    @POST("api/manage/bookings/{id}/onsite-payment")
    suspend fun onsitePayment(
        @Path("id") id: Long,
        @Body request: OnsitePaymentRequest
    ): Response<PaymentResponse>

    @POST("api/manage/bookings/{id}/cancel")
    suspend fun cancelManageBooking(
        @Path("id") id: Long,
        @Body request: ManagerCancelRequest
    ): Response<CancelResultResponse>

    @GET("api/manage/refunds")
    suspend fun getManageRefunds(
        @Query("venueId") venueId: Long? = null,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<PageResponse<ManagerRefundResponse>>

    @POST("api/manage/refunds/{id}/confirm")
    suspend fun confirmRefund(
        @Path("id") id: Long,
        @Body request: ConfirmRefundRequest
    ): Response<ManagerRefundResponse>
}
