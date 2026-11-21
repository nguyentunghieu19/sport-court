package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.AuthResponse
import com.court.sportcourt.data.remote.dto.LoginRequest
import com.court.sportcourt.data.remote.dto.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/password/forgot")
    suspend fun forgot(@Body request: com.court.sportcourt.data.remote.dto.EmailOtpRequest): Response<com.court.sportcourt.data.remote.dto.EmailOtpResponse>
    @POST("api/auth/password/verify-otp")
    suspend fun verifyReset(@Body request: com.court.sportcourt.data.remote.dto.VerifyEmailOtpRequest): Response<com.court.sportcourt.data.remote.dto.EmailOtpResponse>
    @POST("api/auth/password/reset")
    suspend fun reset(@Body request: com.court.sportcourt.data.remote.dto.ResetEmailPasswordRequest): Response<com.court.sportcourt.data.remote.dto.EmailOtpResponse>
    @POST("api/auth/register/request-otp")
    suspend fun requestOtp(@Body request: com.court.sportcourt.data.remote.dto.EmailOtpRequest): Response<com.court.sportcourt.data.remote.dto.EmailOtpResponse>
    @POST("api/auth/register/verify-otp")
    suspend fun verifyOtp(@Body request: com.court.sportcourt.data.remote.dto.VerifyEmailOtpRequest): Response<com.court.sportcourt.data.remote.dto.EmailOtpResponse>

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}
