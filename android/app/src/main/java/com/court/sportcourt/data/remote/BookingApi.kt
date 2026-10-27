package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.BookingRequest
import com.court.sportcourt.data.remote.dto.BookingResponse
import com.court.sportcourt.data.remote.dto.PageResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface BookingApi {

    @POST("api/bookings")
    suspend fun createBooking(@Body request: BookingRequest): Response<BookingResponse>

    @GET("api/bookings/my")
    suspend fun getMyBookings(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PageResponse<BookingResponse>>

    @GET("api/bookings/{id}")
    suspend fun getBookingDetail(@Path("id") id: Long): Response<BookingResponse>
}
