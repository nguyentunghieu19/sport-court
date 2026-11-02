package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.CreatePaymentRequest
import com.court.sportcourt.data.remote.dto.PageResponse
import com.court.sportcourt.data.remote.dto.PaymentResponse
import com.court.sportcourt.data.remote.dto.PaymentUrlResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface PaymentApi {

    @POST("api/payments/vnpay")
    suspend fun createVnpayPayment(
        @Body request: CreatePaymentRequest
    ): Response<PaymentUrlResponse>

    @GET("api/payments/{id}")
    suspend fun getPaymentDetail(
        @Path("id") id: Long
    ): Response<PaymentResponse>

    @GET("api/payments/my")
    suspend fun getMyPayments(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<PageResponse<PaymentResponse>>
}
