package com.court.sportcourt.data.repository

import com.court.sportcourt.data.local.TokenStorage
import com.court.sportcourt.data.remote.UserApi
import com.court.sportcourt.data.remote.dto.ApiError
import com.court.sportcourt.data.remote.dto.ChangePasswordRequest
import com.court.sportcourt.data.remote.dto.UpdateProfileRequest
import com.court.sportcourt.data.remote.dto.UserProfileResponse
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val userApi: UserApi,
    private val tokenStorage: TokenStorage,
    private val json: Json
) {

    suspend fun getProfile(): ApiResult<UserProfileResponse> = handle {
        userApi.getProfile()
    }

    suspend fun updateProfile(
        fullName: String,
        email: String?,
        phone: String?
    ): ApiResult<UserProfileResponse> {
        val result = handle {
            userApi.updateProfile(
                UpdateProfileRequest(
                    fullName = fullName.trim(),
                    email = email?.trim()?.ifBlank { null },
                    phone = phone?.trim()?.ifBlank { null }
                )
            )
        }
        if (result is ApiResult.Success) {
            tokenStorage.updateFullName(result.data.fullName)
        }
        return result
    }

    suspend fun changePassword(
        oldPassword: String,
        newPassword: String
    ): ApiResult<Unit> = handleUnit {
        userApi.changePassword(
            ChangePasswordRequest(
                oldPassword = oldPassword,
                newPassword = newPassword
            )
        )
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

    private suspend fun handleUnit(call: suspend () -> Response<Unit>): ApiResult<Unit> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                ApiResult.Success(Unit)
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
