package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.ChangePasswordRequest
import com.court.sportcourt.data.remote.dto.UpdateProfileRequest
import com.court.sportcourt.data.remote.dto.UserProfileResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT

interface UserApi {

    @GET("api/users/me")
    suspend fun getProfile(): Response<UserProfileResponse>

    @PUT("api/users/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<UserProfileResponse>

    @PUT("api/users/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<Unit>
}
