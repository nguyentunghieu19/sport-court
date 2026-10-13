package com.court.sportcourt.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.court.sportcourt.data.remote.dto.AuthResponse
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

private val Context.sessionDataStore: DataStore<Preferences> by preferencesDataStore(name = "session")

@Singleton
class TokenStorage @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val USER_ID = longPreferencesKey("user_id")
        val FULL_NAME = stringPreferencesKey("full_name")
        val ROLE = stringPreferencesKey("role")
        val EXPIRES_AT = longPreferencesKey("expires_at")
    }

    // Phát ra null nếu chưa đăng nhập hoặc token đã hết hạn
    val session: Flow<UserSession?> = context.sessionDataStore.data
        .catch { error ->
            if (error is IOException) emit(emptyPreferences()) else throw error
        }
        .map { prefs ->
            val token = prefs[Keys.ACCESS_TOKEN]
            val userId = prefs[Keys.USER_ID]
            val fullName = prefs[Keys.FULL_NAME]
            val role = prefs[Keys.ROLE]
            val expiresAt = prefs[Keys.EXPIRES_AT] ?: 0L

            if (token == null || userId == null || fullName == null || role == null ||
                System.currentTimeMillis() >= expiresAt
            ) {
                null
            } else {
                UserSession(token, userId, fullName, role)
            }
        }

    suspend fun save(auth: AuthResponse) {
        context.sessionDataStore.edit { prefs ->
            prefs[Keys.ACCESS_TOKEN] = auth.accessToken
            prefs[Keys.USER_ID] = auth.userId
            prefs[Keys.FULL_NAME] = auth.fullName
            prefs[Keys.ROLE] = auth.role
            prefs[Keys.EXPIRES_AT] = System.currentTimeMillis() + auth.expiresInSeconds * 1000
        }
    }

    suspend fun clear() {
        context.sessionDataStore.edit { it.clear() }
    }
}