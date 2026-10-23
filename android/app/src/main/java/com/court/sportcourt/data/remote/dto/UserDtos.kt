package com.court.sportcourt.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserProfileResponse(
    val id: Long,
    val fullName: String,
    val email: String? = null,
    val phone: String? = null,
    val role: String
)

@Serializable
data class UpdateProfileRequest(
    val fullName: String,
    val email: String? = null,
    val phone: String? = null
)

@Serializable
data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)
