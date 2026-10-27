package com.court.sportcourt.ui.booking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.BookingResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.BookingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.format.DateTimeParseException
import javax.inject.Inject

data class BookingDetailUiState(
    val isLoading: Boolean = false,
    val booking: BookingResponse? = null,
    val remainingSeconds: Long = 0L,
    val formattedCountdown: String = "--:--",
    val isExpired: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class BookingDetailViewModel @Inject constructor(
    private val bookingRepository: BookingRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val bookingId: Long = savedStateHandle.get<Long>("bookingId") ?: 0L
    private var timerJob: Job? = null

    private val _uiState = MutableStateFlow(BookingDetailUiState())
    val uiState: StateFlow<BookingDetailUiState> = _uiState.asStateFlow()

    init {
        loadBookingDetail()
    }

    fun loadBookingDetail() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = bookingRepository.getBookingDetail(bookingId)) {
                is ApiResult.Success -> {
                    val booking = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            booking = booking
                        )
                    }
                    startCountdownTimer(booking.expiresAt)
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message,
                            booking = null
                        )
                    }
                }
            }
        }
    }

    private fun startCountdownTimer(expiresAtString: String?) {
        timerJob?.cancel()
        val expiresEpochMillis = parseExpiresAtToMillis(expiresAtString)

        timerJob = viewModelScope.launch {
            while (true) {
                val nowMillis = System.currentTimeMillis()
                val diffSeconds = (expiresEpochMillis - nowMillis) / 1000

                if (diffSeconds <= 0) {
                    _uiState.update {
                        it.copy(
                            remainingSeconds = 0,
                            formattedCountdown = "00:00",
                            isExpired = true
                        )
                    }
                    break
                } else {
                    val minutes = diffSeconds / 60
                    val seconds = diffSeconds % 60
                    val formatted = String.format("%02d:%02d", minutes, seconds)

                    _uiState.update {
                        it.copy(
                            remainingSeconds = diffSeconds,
                            formattedCountdown = formatted,
                            isExpired = false
                        )
                    }
                }
                delay(1000)
            }
        }
    }

    private fun parseExpiresAtToMillis(expiresAtStr: String?): Long {
        if (expiresAtStr.isNullOrBlank()) {
            return System.currentTimeMillis() + 15 * 60 * 1000
        }
        return try {
            Instant.parse(expiresAtStr).toEpochMilli()
        } catch (e: DateTimeParseException) {
            System.currentTimeMillis() + 15 * 60 * 1000
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}
