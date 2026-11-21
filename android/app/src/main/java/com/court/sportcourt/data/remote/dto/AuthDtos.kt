package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val fullName: String,
    val email: String? = null,
    val phone: String? = null,
    val password: String,
    val emailToken: String? = null
)

@Serializable data class EmailOtpRequest(val email: String)
@Serializable data class VerifyEmailOtpRequest(val email: String, val code: String)
@Serializable data class EmailOtpResponse(val token: String = "", val message: String = "")
@Serializable data class ResetEmailPasswordRequest(val email: String, val token: String, val newPassword: String)

@Serializable
data class LoginRequest(
    val identifier: String,
    val password: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val tokenType: String,
    val expiresInSeconds: Long,
    val userId: Long,
    val fullName: String,
    val role: String
)

// Khớp ErrorResponse của backend: status, error, message, timestamp
@Serializable
data class ApiError(
    val status: Int = 0,
    val error: String? = null,
    val message: String? = null
)
