package com.court.sportcourt.ui.booking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.BookingResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.BookingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.roundToLong

data class BookingConfirmUiState(
    val fieldId: Long = 0L,
    val date: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val totalAmount: Double = 0.0,
    val depositAmount: Double = 0.0,
    val remainingAmount: Double = 0.0,
    val note: String = "",
    val isSubmitting: Boolean = false,
    val createdBooking: BookingResponse? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class BookingConfirmViewModel @Inject constructor(
    private val bookingRepository: BookingRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val fieldId: Long = savedStateHandle.get<Long>("fieldId") ?: 0L
    private val date: String = savedStateHandle.get<String>("date") ?: ""
    private val startTime: String = savedStateHandle.get<String>("startTime") ?: ""
    private val endTime: String = savedStateHandle.get<String>("endTime") ?: ""
    private val totalAmount: Double = savedStateHandle.get<Float>("totalAmount")?.toDouble() ?: 0.0

    private val _uiState = MutableStateFlow(BookingConfirmUiState())
    val uiState: StateFlow<BookingConfirmUiState> = _uiState.asStateFlow()

    init {
        // Tiền cọc dự kiến 30% mặc định (Khớp với DEFAULT_DEPOSIT_PERCENTAGE trong BookingService.java Backend)
        val deposit = (totalAmount * 0.30).roundToLong().toDouble()
        val remaining = totalAmount - deposit

        _uiState.update {
            it.copy(
                fieldId = fieldId,
                date = date,
                startTime = startTime,
                endTime = endTime,
                totalAmount = totalAmount,
                depositAmount = deposit,
                remainingAmount = remaining
            )
        }
    }

    fun onNoteChange(value: String) {
        _uiState.update { it.copy(note = value, errorMessage = null) }
    }

    fun submitBooking(onSuccess: (BookingResponse) -> Unit) {
        val state = _uiState.value
        if (state.isSubmitting) return

        _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
        viewModelScope.launch {
            val result = bookingRepository.createBooking(
                fieldId = state.fieldId,
                date = state.date,
                startTime = state.startTime,
                endTime = state.endTime,
                note = state.note
            )
            when (result) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isSubmitting = false, createdBooking = result.data) }
                    onSuccess(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isSubmitting = false, errorMessage = result.message) }
                }
            }
        }
    }

    fun clearErrorMessage() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
