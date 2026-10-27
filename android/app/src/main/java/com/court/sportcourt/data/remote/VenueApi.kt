package com.court.sportcourt.data.remote

import com.court.sportcourt.data.remote.dto.FieldAvailabilityResponse
import com.court.sportcourt.data.remote.dto.PageResponse
import com.court.sportcourt.data.remote.dto.SportTypeDto
import com.court.sportcourt.data.remote.dto.VenueResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface VenueApi {

    @GET("api/public/venues")
    suspend fun getPublicVenues(
        @Query("keyword") keyword: String? = null,
        @Query("city") city: String? = null,
        @Query("district") district: String? = null,
        @Query("sportType") sportType: String? = null,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 10
    ): Response<PageResponse<VenueResponse>>

    @GET("api/public/sport-types")
    suspend fun getSportTypes(): Response<List<SportTypeDto>>

    @GET("api/public/venues/{id}")
    suspend fun getVenueDetail(@Path("id") id: Long): Response<VenueResponse>

    @GET("api/public/fields/{fieldId}/availability")
    suspend fun getFieldAvailability(
        @Path("fieldId") fieldId: Long,
        @Query("date") date: String
    ): Response<FieldAvailabilityResponse>
}
