package com.court.sportcourt.data.repository

import com.court.sportcourt.data.remote.BookingApi
import com.court.sportcourt.data.remote.dto.ApiError
import com.court.sportcourt.data.remote.dto.BookingRequest
import com.court.sportcourt.data.remote.dto.BookingResponse
import com.court.sportcourt.data.remote.dto.PageResponse
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepository @Inject constructor(
    private val bookingApi: BookingApi,
    private val json: Json
) {

    suspend fun createBooking(
        fieldId: Long,
        date: String,
        startTime: String,
        endTime: String,
        note: String?
    ): ApiResult<BookingResponse> = handle {
        bookingApi.createBooking(
            BookingRequest(
                fieldId = fieldId,
                date = date,
                startTime = startTime,
                endTime = endTime,
                note = note?.trim()?.ifBlank { null }
            )
        )
    }

    suspend fun getMyBookings(
        status: String? = null,
        page: Int = 0,
        size: Int = 20
    ): ApiResult<PageResponse<BookingResponse>> = handle {
        bookingApi.getMyBookings(
            status = status?.trim()?.ifBlank { null },
            page = page,
            size = size
        )
    }

    suspend fun getBookingDetail(id: Long): ApiResult<BookingResponse> = handle {
        bookingApi.getBookingDetail(id)
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
