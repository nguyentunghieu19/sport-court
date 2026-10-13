package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.AuthResponse
import com.court.sportcourt.data.remote.dto.LoginRequest
import com.court.sportcourt.data.remote.dto.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}