package com.court.sportcourt.ui.venue

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.VenueResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.VenueRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VenueDetailUiState(
    val isLoading: Boolean = false,
    val venue: VenueResponse? = null,
    val errorMessage: String? = null,
    val snackbarMessage: String? = null
)

@HiltViewModel
class VenueDetailViewModel @Inject constructor(
    private val venueRepository: VenueRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val venueId: Long = checkNotNull(savedStateHandle["venueId"])

    private val _uiState = MutableStateFlow(VenueDetailUiState())
    val uiState: StateFlow<VenueDetailUiState> = _uiState.asStateFlow()

    init {
        loadVenueDetail()
    }

    fun loadVenueDetail() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = venueRepository.getVenueDetail(venueId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            venue = result.data
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message,
                            venue = null
                        )
                    }
                }
            }
        }
    }

    fun showMaintenanceToast(fieldName: String) {
        _uiState.update {
            it.copy(snackbarMessage = "Sân '$fieldName' đang bảo trì, không thể chọn lịch chơi")
        }
    }

    fun clearSnackbarMessage() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }
}
