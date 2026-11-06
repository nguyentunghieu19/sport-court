package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.CancelResultResponse
import com.court.sportcourt.data.remote.dto.ConfirmRefundRequest
import com.court.sportcourt.data.remote.dto.ManagerBookingResponse
import com.court.sportcourt.data.remote.dto.ManagerCancelRequest
import com.court.sportcourt.data.remote.dto.ManagerRefundResponse
import com.court.sportcourt.data.remote.dto.PageResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ManageApi {

    @GET("api/manage/bookings")
    suspend fun getManageBookings(
        @Query("venueId") venueId: Long? = null,
        @Query("fieldId") fieldId: Long? = null,
        @Query("date") date: String? = null,
        @Query("status") status: String? = null,
        @Query("keyword") keyword: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<PageResponse<ManagerBookingResponse>>

    @GET("api/manage/bookings/{id}")
    suspend fun getManageBookingDetail(
        @Path("id") id: Long
    ): Response<ManagerBookingResponse>

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
