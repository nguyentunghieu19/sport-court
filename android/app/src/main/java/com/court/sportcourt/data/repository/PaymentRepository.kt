package com.court.sportcourt.data.repository

import com.court.sportcourt.data.remote.PaymentApi
import com.court.sportcourt.data.remote.dto.ApiError
import com.court.sportcourt.data.remote.dto.CreatePaymentRequest
import com.court.sportcourt.data.remote.dto.PageResponse
import com.court.sportcourt.data.remote.dto.PaymentResponse
import com.court.sportcourt.data.remote.dto.PaymentUrlResponse
import com.court.sportcourt.data.remote.dto.RefundResponse
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApi: PaymentApi,
    private val json: Json
) {

    suspend fun createVnpayPayment(
        bookingId: Long,
        paymentType: String
    ): ApiResult<PaymentUrlResponse> = handle {
        paymentApi.createVnpayPayment(
            CreatePaymentRequest(bookingId = bookingId, paymentType = paymentType)
        )
    }

    suspend fun getPaymentDetail(id: Long): ApiResult<PaymentResponse> = handle {
        paymentApi.getPaymentDetail(id)
    }

    suspend fun getMyPayments(
        page: Int = 0,
        size: Int = 10
    ): ApiResult<PageResponse<PaymentResponse>> = handle {
        paymentApi.getMyPayments(page = page, size = size)
    }

    suspend fun getMyRefunds(
        bookingId: Long? = null,
        page: Int = 0,
        size: Int = 20
    ): ApiResult<PageResponse<RefundResponse>> = handle {
        paymentApi.getMyRefunds(bookingId = bookingId, page = page, size = size)
    }

    private suspend fun <T> handle(call: suspend () -> Response<T>): ApiResult<T> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                    ?: return ApiResult.Error("Máy chủ trả về dữ liệu trống")
                ApiResult.Success(body)
            } else {
                ApiResult.Error(parseErrorMessage(response))
            }
        } catch (e: IOException) {
            ApiResult.Error("Không kết nối được máy chủ. Hãy kiểm tra mạng và backend")
        } catch (e: SerializationException) {
            ApiResult.Error("Dữ liệu từ máy chủ không đúng định dạng")
        }
    }

    private fun parseErrorMessage(response: Response<*>): String {
        val raw = response.errorBody()?.string()
        val message = try {
            raw?.let { json.decodeFromString<ApiError>(it).message }
        } catch (e: SerializationException) {
            null
        }
        return message ?: "Lỗi ${response.code()}, vui lòng thử lại"
    }
}
