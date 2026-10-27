package com.court.sportcourt.data.repository

import com.court.sportcourt.data.remote.VenueApi
import com.court.sportcourt.data.remote.dto.ApiError
import com.court.sportcourt.data.remote.dto.FieldAvailabilityResponse
import com.court.sportcourt.data.remote.dto.PageResponse
import com.court.sportcourt.data.remote.dto.SportTypeDto
import com.court.sportcourt.data.remote.dto.VenueResponse
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VenueRepository @Inject constructor(
    private val venueApi: VenueApi,
    private val json: Json
) {

    suspend fun getPublicVenues(
        keyword: String? = null,
        city: String? = null,
        district: String? = null,
        sportType: String? = null,
        page: Int = 0,
        size: Int = 10
    ): ApiResult<PageResponse<VenueResponse>> = handle {
        venueApi.getPublicVenues(
            keyword = keyword?.trim()?.ifBlank { null },
            city = city?.trim()?.ifBlank { null },
            district = district?.trim()?.ifBlank { null },
            sportType = sportType?.trim()?.ifBlank { null },
            page = page,
            size = size
        )
    }

    suspend fun getSportTypes(): ApiResult<List<SportTypeDto>> = handle {
        venueApi.getSportTypes()
    }

    suspend fun getVenueDetail(id: Long): ApiResult<VenueResponse> = handle {
        venueApi.getVenueDetail(id)
    }

    suspend fun getFieldAvailability(
        fieldId: Long,
        date: String
    ): ApiResult<FieldAvailabilityResponse> = handle {
        venueApi.getFieldAvailability(fieldId, date)
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
