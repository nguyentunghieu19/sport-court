package com.court.sportcourt.ui.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.local.UserSession
import com.court.sportcourt.data.remote.dto.ManagedVenueResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.AuthRepository
import com.court.sportcourt.data.repository.ManageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StaffHomeUiState(
    val isLoading: Boolean = false,
    val assignedVenues: List<ManagedVenueResponse> = emptyList(),
    val selectedVenueId: Long? = null,
    val isEmptyAssigned: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class StaffHomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val manageRepository: ManageRepository
) : ViewModel() {

    val session: StateFlow<UserSession?> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _uiState = MutableStateFlow(StaffHomeUiState())
    val uiState: StateFlow<StaffHomeUiState> = _uiState.asStateFlow()

    init {
        loadAssignedVenues()
    }

    fun loadAssignedVenues() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.getManagedVenues()) {
                is ApiResult.Success -> {
                    val venues = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            assignedVenues = venues,
                            selectedVenueId = venues.firstOrNull()?.id,
                            isEmptyAssigned = venues.isEmpty()
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message,
                            isEmptyAssigned = true
                        )
                    }
                }
            }
        }
    }

    fun selectVenue(venueId: Long?) {
        _uiState.update { it.copy(selectedVenueId = venueId) }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onDone()
        }
    }
}
