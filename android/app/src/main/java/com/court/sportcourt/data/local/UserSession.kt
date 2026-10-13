package com.court.sportcourt.data.local

data class UserSession(
    val accessToken: String,
    val userId: Long,
    val fullName: String,
    val role: String
)