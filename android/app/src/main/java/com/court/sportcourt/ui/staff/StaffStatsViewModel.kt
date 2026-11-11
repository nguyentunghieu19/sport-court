package com.court.sportcourt.ui.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.ManagerStatsResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.ManageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StaffStatsUiState(
    val isLoading: Boolean = false,
    val selectedVenueId: Long? = null,
    val stats: ManagerStatsResponse? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class StaffStatsViewModel @Inject constructor(
    private val manageRepository: ManageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffStatsUiState())
    val uiState: StateFlow<StaffStatsUiState> = _uiState.asStateFlow()

    fun selectVenueFilter(venueId: Long?) {
        _uiState.update { it.copy(selectedVenueId = venueId) }
        loadStats(venueId)
    }

    fun loadStats(venueId: Long? = _uiState.value.selectedVenueId) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.getManageStats(venueId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            stats = result.data
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }
}
