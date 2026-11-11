package com.court.sportcourt.ui.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.ManagerBookingResponse
import com.court.sportcourt.data.remote.dto.ManagerStatsResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.ManageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StaffBookingUiState(
    val isLoading: Boolean = false,
    val keyword: String = "",
    val selectedVenueId: Long? = null,
    val selectedStatus: String? = null,
    val selectedDate: String? = null,
    val stats: ManagerStatsResponse? = null,
    val bookings: List<ManagerBookingResponse> = emptyList(),
    val page: Int = 0,
    val totalPages: Int = 1,
    val errorMessage: String? = null
)

@HiltViewModel
class StaffBookingViewModel @Inject constructor(
    private val manageRepository: ManageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffBookingUiState())
    val uiState: StateFlow<StaffBookingUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadStats(null)
        loadBookings(0)
    }

    fun onKeywordChange(value: String) {
        _uiState.update { it.copy(keyword = value) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(400)
            loadBookings(0)
        }
    }

    fun selectVenueFilter(venueId: Long?) {
        _uiState.update { it.copy(selectedVenueId = venueId) }
        loadStats(venueId)
        loadBookings(0)
    }

    fun selectStatusFilter(status: String?) {
        _uiState.update { it.copy(selectedStatus = status) }
        loadBookings(0)
    }

    fun selectDateFilter(date: String?) {
        _uiState.update { it.copy(selectedDate = date) }
        loadBookings(0)
    }

    fun loadStats(venueId: Long? = _uiState.value.selectedVenueId) {
        viewModelScope.launch {
            when (val result = manageRepository.getManageStats(venueId)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(stats = result.data) }
                }
                is ApiResult.Error -> {}
            }
        }
    }

    fun goToPage(targetPage: Int) {
        val state = _uiState.value
        if (state.isLoading || targetPage < 0 || targetPage >= state.totalPages) return
        loadBookings(targetPage)
    }

    fun goToNextPage() {
        val state = _uiState.value
        if (state.page < state.totalPages - 1) {
            goToPage(state.page + 1)
        }
    }

    fun goToPreviousPage() {
        val state = _uiState.value
        if (state.page > 0) {
            goToPage(state.page + 1)
        }
    }

    fun loadBookings(page: Int = _uiState.value.page) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val state = _uiState.value
            val result = manageRepository.getManageBookings(
                venueId = state.selectedVenueId,
                keyword = state.keyword.ifBlank { null },
                status = state.selectedStatus,
                date = state.selectedDate,
                page = page,
                size = 10
            )
            when (result) {
                is ApiResult.Success -> {
                    val pageResponse = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            bookings = pageResponse.content,
                            page = pageResponse.page,
                            totalPages = if (pageResponse.totalPages > 0) pageResponse.totalPages else 1
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
