package com.court.sportcourt.data.repository

import com.court.sportcourt.data.remote.ManageApi
import com.court.sportcourt.data.remote.dto.ApiError
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
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ManageRepository @Inject constructor(
    private val manageApi: ManageApi,
    private val json: Json
) {

    suspend fun getManagedVenues(): ApiResult<List<ManagedVenueResponse>> = handle {
        manageApi.getManagedVenues()
    }

    suspend fun getManagedFields(venueId: Long): ApiResult<List<FieldDto>> = handle {
        manageApi.getManagedFields(venueId)
    }

    suspend fun getManageStats(venueId: Long? = null): ApiResult<ManagerStatsResponse> = handle {
        manageApi.getManageStats(venueId = venueId)
    }

    suspend fun getManageBookings(
        venueId: Long? = null,
        fieldId: Long? = null,
        date: String? = null,
        status: String? = null,
        keyword: String? = null,
        outstandingOnly: Boolean? = null,
        page: Int = 0,
        size: Int = 10
    ): ApiResult<PageResponse<ManagerBookingResponse>> = handle {
        manageApi.getManageBookings(
            venueId = venueId,
            fieldId = fieldId,
            date = date?.trim()?.ifBlank { null },
            status = status?.trim()?.ifBlank { null },
            keyword = keyword?.trim()?.ifBlank { null },
            outstandingOnly = outstandingOnly,
            page = page,
            size = size
        )
    }

    suspend fun getManageBookingDetail(id: Long): ApiResult<ManagerBookingResponse> = handle {
        manageApi.getManageBookingDetail(id)
    }

    suspend fun checkInBookingById(id: Long): ApiResult<ManagerBookingResponse> = handle {
        manageApi.checkInBookingById(id)
    }

    suspend fun checkInBookingByCode(code: String): ApiResult<ManagerBookingResponse> = handle {
        manageApi.checkInBookingByCode(CheckInCodeRequest(bookingCode = code.trim()))
    }

    suspend fun completeBooking(id: Long): ApiResult<ManagerBookingResponse> = handle {
        manageApi.completeBooking(id)
    }

    suspend fun noShowBooking(id: Long): ApiResult<ManagerBookingResponse> = handle {
        manageApi.noShowBooking(id)
    }

    suspend fun onsitePayment(id: Long, method: String, amount: Double): ApiResult<PaymentResponse> = handle {
        manageApi.onsitePayment(
            id = id,
            request = OnsitePaymentRequest(
                method = method,
                amount = amount,
                idempotencyKey = UUID.randomUUID().toString()
            )
        )
    }

    suspend fun cancelManageBooking(id: Long, reason: String): ApiResult<CancelResultResponse> = handle {
        manageApi.cancelManageBooking(id, ManagerCancelRequest(reason = reason.trim()))
    }

    suspend fun getManageRefunds(
        venueId: Long? = null,
        status: String? = null,
        page: Int = 0,
        size: Int = 10
    ): ApiResult<PageResponse<ManagerRefundResponse>> = handle {
        manageApi.getManageRefunds(
            venueId = venueId,
            status = status?.trim()?.ifBlank { null },
            page = page,
            size = size
        )
    }

    suspend fun confirmRefund(id: Long, note: String): ApiResult<ManagerRefundResponse> = handle {
        manageApi.confirmRefund(id, ConfirmRefundRequest(note = note.trim()))
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
