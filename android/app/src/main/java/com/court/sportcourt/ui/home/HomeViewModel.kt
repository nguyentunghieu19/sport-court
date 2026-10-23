package com.court.sportcourt.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.local.UserSession
import com.court.sportcourt.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
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

data class SportCategory(
    val id: String,
    val name: String,
    val iconEmoji: String
)

data class SportCourtItem(
    val id: Long,
    val name: String,
    val categoryId: String,
    val categoryName: String,
    val address: String,
    val pricePerHour: String,
    val rating: Double,
    val reviewCount: Int,
    val isAvailable: Boolean = true
)

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
    val selectedCategoryId: String = "all",
    val searchQuery: String = "",
    val categories: List<SportCategory> = listOf(
        SportCategory("all", "Tất cả", "🏆"),
        SportCategory("football", "Bóng đá", "⚽"),
        SportCategory("badminton", "Cầu lông", "🏸"),
        SportCategory("tennis", "Tennis", "🎾"),
        SportCategory("basketball", "Bóng rổ", "🏀"),
        SportCategory("pickleball", "Pickleball", "🏓")
    ),
    val filteredCourts: List<SportCourtItem> = emptyList(),
    val mockBookings: List<BookingItem> = listOf(
        BookingItem(
            id = 101,
            courtName = "Sân Bóng Đá Chảo Lửa",
            categoryName = "Bóng đá",
            date = "Hôm nay",
            timeSlot = "18:00 - 19:30",
            price = "250.000đ",
            status = "Đã xác nhận"
        ),
        BookingItem(
            id = 102,
            courtName = "CLB Cầu Lông Viettel",
            categoryName = "Cầu lông",
            date = "Ngày mai",
            timeSlot = "19:00 - 21:00",
            price = "240.000đ",
            status = "Chờ thanh toán"
        )
    ),
    val mockNotifications: List<NotificationItem> = listOf(
        NotificationItem(
            id = 1,
            title = "Đặt sân thành công! 🎉",
            message = "Sân Bóng Đá Chảo Lửa đã được xác nhận lịch chơi từ 18:00 - 19:30.",
            time = "10 phút trước",
            isUnread = true
        ),
        NotificationItem(
            id = 2,
            title = "Nhắc nhở lịch chơi ⏰",
            message = "Bạn có lịch đặt sân cầu lông vào ngày mai lúc 19:00. Vui lòng đến trước 15 phút.",
            time = "2 giờ trước",
            isUnread = true
        )
    ),
    val snackbarMessage: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val session: StateFlow<UserSession?> = authRepository.session
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val allCourts = listOf(
        SportCourtItem(
            id = 1,
            name = "Sân Bóng Đá Chảo Lửa",
            categoryId = "football",
            categoryName = "Bóng đá",
            address = "30 Phan Thúc Duyện, Tân Bình, TP.HCM",
            pricePerHour = "250.000đ/giờ",
            rating = 4.8,
            reviewCount = 128
        ),
        SportCourtItem(
            id = 2,
            name = "CLB Cầu Lông Viettel",
            categoryId = "badminton",
            categoryName = "Cầu lông",
            address = "158 Thành Thái, Quận 10, TP.HCM",
            pricePerHour = "120.000đ/giờ",
            rating = 4.9,
            reviewCount = 215
        ),
        SportCourtItem(
            id = 3,
            name = "Sân Tennis Kỳ Hòa",
            categoryId = "tennis",
            categoryName = "Tennis",
            address = "238 3 Tháng 2, Quận 10, TP.HCM",
            pricePerHour = "180.000đ/giờ",
            rating = 4.7,
            reviewCount = 89
        ),
        SportCourtItem(
            id = 4,
            name = "Sân Pickleball Sài Gòn Central",
            categoryId = "pickleball",
            categoryName = "Pickleball",
            address = "12 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM",
            pricePerHour = "150.000đ/giờ",
            rating = 4.9,
            reviewCount = 340
        ),
        SportCourtItem(
            id = 5,
            name = "Sân Bóng Rổ Phú Thọ",
            categoryId = "basketball",
            categoryName = "Bóng rổ",
            address = "219 Lý Thường Kiệt, Quận 11, TP.HCM",
            pricePerHour = "200.000đ/giờ",
            rating = 4.6,
            reviewCount = 76
        ),
        SportCourtItem(
            id = 6,
            name = "Sân Cầu Lông Celadon",
            categoryId = "badminton",
            categoryName = "Cầu lông",
            address = "36 Tân Thắng, Tân Phú, TP.HCM",
            pricePerHour = "110.000đ/giờ",
            rating = 4.8,
            reviewCount = 94
        )
    )

    private val _uiState = MutableStateFlow(HomeUiState(filteredCourts = allCourts))
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun selectTab(tab: HomeTab) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun selectCategory(categoryId: String) {
        _uiState.update { current ->
            val updated = current.copy(selectedCategoryId = categoryId)
            updated.copy(filteredCourts = filterCourts(updated.selectedCategoryId, updated.searchQuery))
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { current ->
            val updated = current.copy(searchQuery = query)
            updated.copy(filteredCourts = filterCourts(updated.selectedCategoryId, updated.searchQuery))
        }
    }

    fun onBookCourtClick(courtName: String) {
        _uiState.update {
            it.copy(snackbarMessage = "Tính năng đặt sân cho '$courtName' đang được phát triển!")
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

    private fun filterCourts(categoryId: String, query: String): List<SportCourtItem> {
        return allCourts.filter { court ->
            val matchesCategory = categoryId == "all" || court.categoryId == categoryId
            val matchesQuery = query.isBlank() ||
                    court.name.contains(query, ignoreCase = true) ||
                    court.address.contains(query, ignoreCase = true) ||
                    court.categoryName.contains(query, ignoreCase = true)
            matchesCategory && matchesQuery
        }
    }
}
