package com.court.sportcourt.ui.field

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.FieldAvailabilityResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.BookingRepository
import com.court.sportcourt.data.repository.VenueRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import javax.inject.Inject

data class DateOption(
    val dateString: String, // YYYY-MM-DD
    val displayDay: String, // "Hôm nay", "Thứ 2", ...
    val displayDate: String // "25/10"
)

data class FieldAvailabilityUiState(
    val isLoading: Boolean = false,
    val selectedDate: String = "",
    val dateOptions: List<DateOption> = emptyList(),
    val availabilityResponse: FieldAvailabilityResponse? = null,
    val isBookable: Boolean = true, // bookable = false thì ẩn lưới
    val selectedSlotIndexes: Set<Int> = emptySet(), // Danh sách các ô giờ liền nhau đã chọn
    val totalSelectedPrice: Double = 0.0,
    val errorMessage: String? = null,
    val snackbarMessage: String? = null
)

@HiltViewModel
class FieldAvailabilityViewModel @Inject constructor(
    private val venueRepository: VenueRepository,
    private val bookingRepository: BookingRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val fieldId: Long = checkNotNull(savedStateHandle["fieldId"])

    private val _uiState = MutableStateFlow(FieldAvailabilityUiState())
    val uiState: StateFlow<FieldAvailabilityUiState> = _uiState.asStateFlow()

    val selectedStartTime: String
        get() {
            val slots = _uiState.value.availabilityResponse?.timeSlots ?: return "18:00"
            val selected = _uiState.value.selectedSlotIndexes.sorted()
            return if (selected.isNotEmpty()) slots[selected.first()].startTime else "18:00"
        }

    val selectedEndTime: String
        get() {
            val slots = _uiState.value.availabilityResponse?.timeSlots ?: return "19:00"
            val selected = _uiState.value.selectedSlotIndexes.sorted()
            return if (selected.isNotEmpty()) slots[selected.last()].endTime else "19:00"
        }

    init {
        val dates = generateDateOptions()
        val todayDate = dates.first().dateString
        _uiState.update {
            it.copy(
                dateOptions = dates,
                selectedDate = todayDate
            )
        }
        loadAvailability(todayDate)
    }

    fun selectDate(dateString: String) {
        _uiState.update {
            it.copy(
                selectedDate = dateString,
                selectedSlotIndexes = emptySet(),
                totalSelectedPrice = 0.0
            )
        }
        loadAvailability(dateString)
    }

    fun loadAvailability(dateString: String) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val availabilityResult = venueRepository.getFieldAvailability(fieldId, dateString)
            val pendingBookingsResult = bookingRepository.getMyBookings(status = "PENDING_PAYMENT")

            when (availabilityResult) {
                is ApiResult.Success -> {
                    val response = availabilityResult.data
                    val pendingBookings = if (pendingBookingsResult is ApiResult.Success) {
                        pendingBookingsResult.data.content.filter {
                            (it.fieldId == fieldId) && (it.date == dateString)
                        }
                    } else emptyList()

                    val updatedSlots = response.slots.map { slot ->
                        val matchingPendingBooking = pendingBookings.find { pending ->
                            val slotStart = slot.startTime.take(5)
                            val pendingStart = (pending.startTime ?: "").take(5)
                            slotStart == pendingStart
                        }
                        if (matchingPendingBooking != null && (slot.status == "BOOKED" || slot.status == "PENDING" || slot.status == "PENDING_PAYMENT")) {
                            slot.copy(
                                status = "PENDING_PAYMENT",
                                myPendingBookingId = matchingPendingBooking.id
                            )
                        } else {
                            slot
                        }
                    }

                    val updatedResponse = response.copy(slots = updatedSlots)

                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            availabilityResponse = updatedResponse,
                            isBookable = response.bookable
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = availabilityResult.message,
                            availabilityResponse = null
                        )
                    }
                }
            }
        }
    }

    fun toggleTimeSlot(index: Int, onOpenMyPendingBooking: (Long) -> Unit = {}) {
        val slots = _uiState.value.availabilityResponse?.timeSlots ?: return
        if (index !in slots.indices) return

        val slot = slots[index]

        // Nếu đây là ô giờ ĐANG XỬ LÝ CỦA CHÍNH NGƯỜI DÙNG NÀY -> Cho bấm vào lại để mở Màn Chi tiết đơn
        if (slot.status == "PENDING_PAYMENT" && slot.myPendingBookingId != null) {
            onOpenMyPendingBooking(slot.myPendingBookingId)
            return
        }

        if (slot.status != "AVAILABLE") {
            val message = if (slot.status == "PENDING_PAYMENT") {
                "Khung giờ này đang có người khác chọn giữ chỗ & thanh toán cọc, không thể chọn"
            } else {
                "Khung giờ này đã được đặt hoặc bảo trì, không thể chọn"
            }
            _uiState.update {
                it.copy(snackbarMessage = message)
            }
            return
        }

        val currentSelected = _uiState.value.selectedSlotIndexes.toMutableSet()

        if (currentSelected.contains(index)) {
            currentSelected.remove(index)
            if (!isContiguous(currentSelected)) {
                currentSelected.clear()
            }
        } else {
            currentSelected.add(index)
            if (!isContiguous(currentSelected)) {
                _uiState.update {
                    it.copy(snackbarMessage = "Vui lòng chọn các khung giờ liền nhau!")
                }
                currentSelected.clear()
                currentSelected.add(index)
            }
        }

        val totalPrice = currentSelected.sumOf { slots[it].price }

        _uiState.update {
            it.copy(
                selectedSlotIndexes = currentSelected,
                totalSelectedPrice = totalPrice
            )
        }
    }

    fun clearSnackbarMessage() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    private fun isContiguous(indexes: Set<Int>): Boolean {
        if (indexes.isEmpty() || indexes.size == 1) return true
        val sorted = indexes.sorted()
        for (i in 0 until sorted.size - 1) {
            if (sorted[i + 1] - sorted[i] != 1) {
                return false
            }
        }
        return true
    }

    private fun generateDateOptions(): List<DateOption> {
        val options = mutableListOf<DateOption>()
        var current = LocalDate.now()
        val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val displayFormatter = DateTimeFormatter.ofPattern("dd/MM")

        for (i in 0..6) {
            val dateStr = current.format(dateFormatter)
            val dayName = when (i) {
                0 -> "Hôm nay"
                1 -> "Ngày mai"
                else -> current.dayOfWeek.getDisplayName(java.time.format.TextStyle.SHORT, Locale("vi", "VN"))
            }
            options.add(
                DateOption(
                    dateString = dateStr,
                    displayDay = dayName,
                    displayDate = current.format(displayFormatter)
                )
            )
            current = current.plusDays(1)
        }
        return options
    }
}
