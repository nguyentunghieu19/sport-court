package com.court.sportcourt.di

import com.court.sportcourt.data.local.TokenStorage
import com.court.sportcourt.data.remote.AuthApi
import com.court.sportcourt.data.remote.UserApi
import com.court.sportcourt.data.remote.VenueApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class PublicNetwork

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthenticatedNetwork

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    // Cấu hình mạng kết nối trực tiếp 127.0.0.1:8080 qua adb reverse
    private const val BASE_URL = "http://127.0.0.1:8080/"

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    // 1. Client cho API Public (KHÔNG gắn token)
    @Provides
    @Singleton
    @PublicNetwork
    fun providePublicOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        return OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    @PublicNetwork
    fun providePublicRetrofit(@PublicNetwork client: OkHttpClient, json: Json): Retrofit =
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    // 2. Client cho API Authenticated (CÓ AuthInterceptor gắn token)
    @Provides
    @Singleton
    @AuthenticatedNetwork
    fun provideAuthenticatedOkHttpClient(tokenStorage: TokenStorage): OkHttpClient {
        val authInterceptor = Interceptor { chain ->
            val token = runBlocking { tokenStorage.session.firstOrNull()?.accessToken }
            val request = if (!token.isNullOrBlank()) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else {
                chain.request()
            }
            chain.proceed(request)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
            redactHeader("Authorization")
        }
        return OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    @AuthenticatedNetwork
    fun provideAuthenticatedRetrofit(@AuthenticatedNetwork client: OkHttpClient, json: Json): Retrofit =
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    // Cung cấp API interfaces
    @Provides
    @Singleton
    fun provideVenueApi(@PublicNetwork retrofit: Retrofit): VenueApi =
        retrofit.create(VenueApi::class.java)

    @Provides
    @Singleton
    fun provideAuthApi(@AuthenticatedNetwork retrofit: Retrofit): AuthApi =
        retrofit.create(AuthApi::class.java)

    @Provides
    @Singleton
    fun provideUserApi(@AuthenticatedNetwork retrofit: Retrofit): UserApi =
        retrofit.create(UserApi::class.java)

    @Provides
    @Singleton
    fun provideBookingApi(@AuthenticatedNetwork retrofit: Retrofit): com.court.sportcourt.data.remote.BookingApi =
        retrofit.create(com.court.sportcourt.data.remote.BookingApi::class.java)
}
