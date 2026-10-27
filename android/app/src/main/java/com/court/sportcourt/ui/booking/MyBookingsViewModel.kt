package com.court.sportcourt.ui.booking

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

data class MyBookingsUiState(
    val isLoading: Boolean = false,
    val selectedStatus: String? = null,
    val bookings: List<BookingResponse> = emptyList(),
    val errorMessage: String? = null
)

@HiltViewModel
class MyBookingsViewModel @Inject constructor(
    private val bookingRepository: BookingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyBookingsUiState())
    val uiState: StateFlow<MyBookingsUiState> = _uiState.asStateFlow()

    init {
        loadMyBookings(null)
    }

    fun selectStatusFilter(status: String?) {
        _uiState.update { it.copy(selectedStatus = status) }
        loadMyBookings(status)
    }

    fun loadMyBookings(statusFilter: String? = _uiState.value.selectedStatus) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = bookingRepository.getMyBookings(status = statusFilter)) {
                is ApiResult.Success -> {
                    val list = result.data.content
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            bookings = list
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message,
                            bookings = emptyList()
                        )
                    }
                }
            }
        }
    }
}
