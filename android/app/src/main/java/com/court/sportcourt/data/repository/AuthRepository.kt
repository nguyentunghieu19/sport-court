package com.court.sportcourt.data.repository

import com.court.sportcourt.data.local.TokenStorage
import com.court.sportcourt.data.local.UserSession
import com.court.sportcourt.data.remote.AuthApi
import com.court.sportcourt.data.remote.dto.ApiError
import com.court.sportcourt.data.remote.dto.AuthResponse
import com.court.sportcourt.data.remote.dto.LoginRequest
import com.court.sportcourt.data.remote.dto.RegisterRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenStorage: TokenStorage,
    private val json: Json
) {

    // null = chưa đăng nhập hoặc phiên đã hết hạn
    val session: Flow<UserSession?> = tokenStorage.session

    suspend fun register(
        fullName: String,
        email: String?,
        phone: String?,
        password: String
    ): ApiResult<Unit> = handle {
        authApi.register(
            RegisterRequest(
                fullName = fullName.trim(),
                email = email?.trim()?.ifBlank { null },
                phone = phone?.trim()?.ifBlank { null },
                password = password
            )
        )
    }

    suspend fun login(identifier: String, password: String): ApiResult<Unit> = handle {
        authApi.login(LoginRequest(identifier = identifier.trim(), password = password))
    }

    suspend fun logout() {
        tokenStorage.clear()
    }

    private suspend fun handle(call: suspend () -> Response<AuthResponse>): ApiResult<Unit> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                    ?: return ApiResult.Error("Máy chủ trả về dữ liệu trống")
                tokenStorage.save(body)
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