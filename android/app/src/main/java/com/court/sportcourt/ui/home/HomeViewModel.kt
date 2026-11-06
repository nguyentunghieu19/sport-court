package com.court.sportcourt.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.local.UserSession
import com.court.sportcourt.data.remote.dto.SportTypeDto
import com.court.sportcourt.data.remote.dto.VenueResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.AuthRepository
import com.court.sportcourt.data.repository.BookingRepository
import com.court.sportcourt.data.repository.PaymentRepository
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
    val notifications: List<NotificationItem> = emptyList(),
    val snackbarMessage: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val venueRepository: VenueRepository,
    private val bookingRepository: BookingRepository,
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    val session: StateFlow<UserSession?> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadSportTypes()
        loadVenues(page = 0, isInitial = true)
        loadUserNotifications()
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

    fun loadUserNotifications() {
        viewModelScope.launch {
            val notificationList = mutableListOf<NotificationItem>()

            // 1. Tải thông báo Hoàn tiền từ Staff/Admin (GET /api/refunds/my)
            when (val refundResult = paymentRepository.getMyRefunds(page = 0, size = 10)) {
                is ApiResult.Success -> {
                    refundResult.data.content.forEachIndexed { index, refund ->
                        val isRefunded = refund.status == "SUCCEEDED"
                        notificationList.add(
                            NotificationItem(
                                id = 10000L + refund.id,
                                title = if (isRefunded) "🟢 Staff đã hoàn tiền thành công! 🎉" else "💸 Yêu cầu hoàn tiền đang xử lý",
                                message = "Đơn ${refund.bookingCode ?: ""} đã được Staff/Chủ sân ${if (isRefunded) "hoàn tiền thành công: " else "tiếp nhận yêu cầu hoàn tiền: "}${refund.amount.toLong()} đ. ${if (!refund.referenceNote.isNullOrBlank()) "Ghi chú: ${refund.referenceNote}" else ""}",
                                time = if (index == 0) "Vừa xong" else "${(index + 1) * 20} phút trước",
                                isUnread = index == 0
                            )
                        )
                    }
                }
                is ApiResult.Error -> {}
            }

            // 2. Tải thông báo Đơn hàng/Hủy đơn từ Staff/Admin (GET /api/bookings/my)
            when (val bookingResult = bookingRepository.getMyBookings(page = 0, size = 10)) {
                is ApiResult.Success -> {
                    bookingResult.data.content.forEachIndexed { index, booking ->
                        when (booking.status) {
                            "CONFIRMED" -> {
                                notificationList.add(
                                    NotificationItem(
                                        id = booking.id,
                                        title = "🎉 Đặt sân thành công!",
                                        message = "Đơn ${booking.bookingCode} (${booking.venueName ?: "Cụm sân"} - ${booking.fieldName ?: "Sân"}) ngày ${booking.date ?: ""} (${booking.startTime ?: ""} - ${booking.endTime ?: ""}) đã được xác nhận lịch chơi.",
                                        time = if (index == 0) "Vừa xong" else "${(index + 1) * 15} phút trước",
                                        isUnread = index == 0
                                    )
                                )
                            }
                            "CANCELLED" -> {
                                notificationList.add(
                                    NotificationItem(
                                        id = booking.id + 5000L,
                                        title = "🔴 Đơn đặt sân đã bị hủy",
                                        message = "Đơn ${booking.bookingCode} (${booking.venueName ?: "Cụm sân"}) ngày ${booking.date ?: ""} đã bị hủy. ${if (!booking.cancellationReason.isNullOrBlank()) "Lý do: ${booking.cancellationReason}" else ""}",
                                        time = "${(index + 1) * 30} phút trước",
                                        isUnread = false
                                    )
                                )
                            }
                            "PENDING_PAYMENT" -> {
                                notificationList.add(
                                    NotificationItem(
                                        id = booking.id,
                                        title = "🟡 Đơn đặt sân chờ thanh toán cọc",
                                        message = "Đơn ${booking.bookingCode} đang trong thời gian giữ chỗ 15 phút. Vui lòng thanh toán cọc để hoàn tất.",
                                        time = "Vừa xong",
                                        isUnread = true
                                    )
                                )
                            }
                        }
                    }
                }
                is ApiResult.Error -> {}
            }

            _uiState.update { it.copy(notifications = notificationList) }
        }
    }

    fun selectTab(tab: HomeTab) {
        _uiState.update { it.copy(currentTab = tab) }
        if (tab == HomeTab.NOTIFICATIONS) {
            loadUserNotifications()
        }
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
        loadSportTypes()
        loadVenues(page = 0, isInitial = true)
        loadUserNotifications()
        _uiState.update { it.copy(snackbarMessage = "Đã cập nhật dữ liệu sân mới nhất từ hệ thống!") }
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
