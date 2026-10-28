package com.court.sportcourt.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.local.UserSession
import com.court.sportcourt.data.remote.dto.SportTypeDto
import com.court.sportcourt.data.remote.dto.VenueResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.AuthRepository
import com.court.sportcourt.data.repository.VenueRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class HomeTab {
    HOME, BOOKINGS, NOTIFICATIONS, PROFILE
}

data class BookingItem(
    val id: Long,
    val courtName: String,
    val categoryName: String,
    val date: String,
    val timeSlot: String,
    val price: String,
    val status: String
)

data class NotificationItem(
    val id: Long,
    val title: String,
    val message: String,
    val time: String,
    val isUnread: Boolean = true
)

data class HomeUiState(
    val currentTab: HomeTab = HomeTab.HOME,
    val searchQuery: String = "",
    val selectedCity: String? = null,
    val selectedDistrict: String? = null,
    val selectedSportCode: String? = null,
    val sportTypes: List<SportTypeDto> = emptyList(),
    val showFilterSheet: Boolean = false,
    val venues: List<VenueResponse> = emptyList(),
    val page: Int = 0,
    val totalPages: Int = 1,
    val totalElements: Long = 0,
    val isLastPage: Boolean = false,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val mockBookings: List<BookingItem> = emptyList(),
    val mockNotifications: List<NotificationItem> = emptyList(),
    val snackbarMessage: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val venueRepository: VenueRepository
) : ViewModel() {

    val session: StateFlow<UserSession?> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadSportTypes()
        loadVenues(page = 0, isInitial = true)
    }

    private fun loadSportTypes() {
        viewModelScope.launch {
            when (val result = venueRepository.getSportTypes()) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(sportTypes = result.data) }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            sportTypes = listOf(
                                SportTypeDto("FOOTBALL", "Bóng đá"),
                                SportTypeDto("BADMINTON", "Cầu lông"),
                                SportTypeDto("TENNIS", "Tennis"),
                                SportTypeDto("BASKETBALL", "Bóng rổ"),
                                SportTypeDto("PICKLEBALL", "Pickleball")
                            )
                        )
                    }
                }
            }
        }
    }

    fun selectTab(tab: HomeTab) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun toggleFilterSheet(show: Boolean) {
        _uiState.update { it.copy(showFilterSheet = show) }
    }

    fun applyFilters(city: String?, district: String?, sportCode: String?) {
        _uiState.update {
            it.copy(
                selectedCity = city?.ifBlank { null },
                selectedDistrict = district?.ifBlank { null },
                selectedSportCode = sportCode?.ifBlank { null },
                showFilterSheet = false
            )
        }
        loadVenues(page = 0, isInitial = true)
    }

    fun clearFilters() {
        _uiState.update {
            it.copy(
                selectedCity = null,
                selectedDistrict = null,
                selectedSportCode = null,
                showFilterSheet = false
            )
        }
        loadVenues(page = 0, isInitial = true)
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(400)
            loadVenues(page = 0, isInitial = true)
        }
    }

    fun goToPage(targetPage: Int) {
        val state = _uiState.value
        if (state.isLoading || targetPage < 0 || targetPage >= state.totalPages) return
        loadVenues(page = targetPage, isInitial = true)
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
            goToPage(state.page - 1)
        }
    }

    fun refreshVenues() {
        loadVenues(page = 0, isInitial = true)
    }

    private fun loadVenues(page: Int, isInitial: Boolean) {
        if (isInitial) {
            _uiState.update { it.copy(isLoading = true, isLastPage = false) }
        }

        viewModelScope.launch {
            val state = _uiState.value
            val query = state.searchQuery.ifBlank { null }
            val result = venueRepository.getPublicVenues(
                keyword = query,
                city = state.selectedCity,
                district = state.selectedDistrict,
                sportType = state.selectedSportCode,
                page = page,
                size = 10
            )

            when (result) {
                is ApiResult.Success -> {
                    val pageResponse = result.data
                    _uiState.update { current ->
                        current.copy(
                            isLoading = false,
                            isLoadingMore = false,
                            venues = pageResponse.content,
                            page = pageResponse.page,
                            totalPages = if (pageResponse.totalPages > 0) pageResponse.totalPages else 1,
                            totalElements = pageResponse.totalElements,
                            isLastPage = pageResponse.last || pageResponse.content.isEmpty()
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { current ->
                        current.copy(
                            isLoading = false,
                            isLoadingMore = false,
                            snackbarMessage = result.message,
                            isLastPage = true
                        )
                    }
                }
            }
        }
    }

    fun onVenueClick(venue: VenueResponse) {
        _uiState.update {
            it.copy(snackbarMessage = "Đang xem địa điểm: ${venue.name}")
        }
    }

    fun clearSnackbarMessage() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onDone()
        }
    }
}
