package com.court.sportcourt.ui.staff

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.ManagerBookingResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.ManageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StaffBookingDetailUiState(
    val isLoading: Boolean = false,
    val managerBooking: ManagerBookingResponse? = null,
    val showCancelDialog: Boolean = false,
    val cancelReason: String = "",
    val isCancelling: Boolean = false,
    val showPaymentDialog: Boolean = false,
    val paymentMethod: String = "CASH", // "CASH" hoặc "BANK_TRANSFER"
    val isProcessingAction: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class StaffBookingDetailViewModel @Inject constructor(
    private val manageRepository: ManageRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val bookingId: Long = savedStateHandle.get<Long>("bookingId") ?: 0L

    private val _uiState = MutableStateFlow(StaffBookingDetailUiState())
    val uiState: StateFlow<StaffBookingDetailUiState> = _uiState.asStateFlow()

    init {
        loadDetail()
    }

    fun loadDetail() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.getManageBookingDetail(bookingId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            managerBooking = result.data
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

    fun checkInBooking() {
        _uiState.update { it.copy(isProcessingAction = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.checkInBookingById(bookingId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            managerBooking = result.data,
                            successMessage = "Check-in đơn thành công! 📲"
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun completeBooking() {
        _uiState.update { it.copy(isProcessingAction = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.completeBooking(bookingId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            managerBooking = result.data,
                            successMessage = "Hoàn thành đơn đặt sân! 🎉"
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun noShowBooking() {
        _uiState.update { it.copy(isProcessingAction = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = manageRepository.noShowBooking(bookingId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            managerBooking = result.data,
                            successMessage = "Đã đánh dấu Khách vắng mặt (No-show)"
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun togglePaymentDialog(show: Boolean, method: String = "CASH") {
        _uiState.update {
            it.copy(
                showPaymentDialog = show,
                paymentMethod = method,
                errorMessage = null
            )
        }
    }

    fun submitOnsitePayment() {
        val state = _uiState.value
        val booking = state.managerBooking ?: return
        val amount = booking.outstandingAmount
        if (amount <= 0) {
            _uiState.update { it.copy(errorMessage = "Đơn đã thu đủ tiền, không còn nợ tại sân.") }
            return
        }

        _uiState.update { it.copy(isProcessingAction = true, errorMessage = null) }
        viewModelScope.launch {
            val result = manageRepository.onsitePayment(
                id = bookingId,
                method = state.paymentMethod,
                amount = amount
            )
            when (result) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            showPaymentDialog = false,
                            successMessage = "Ghi nhận thu tiền tại sân thành công! 💵"
                        )
                    }
                    loadDetail()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isProcessingAction = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun onReasonChange(value: String) {
        _uiState.update { it.copy(cancelReason = value, errorMessage = null) }
    }

    fun toggleCancelDialog(show: Boolean) {
        _uiState.update { it.copy(showCancelDialog = show, cancelReason = "", errorMessage = null) }
    }

    fun cancelBooking() {
        val state = _uiState.value
        if (state.cancelReason.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Vui lòng nhập lý do hủy đơn") }
            return
        }

        _uiState.update { it.copy(isCancelling = true, errorMessage = null) }
        viewModelScope.launch {
            val result = manageRepository.cancelManageBooking(bookingId, state.cancelReason)
            when (result) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isCancelling = false,
                            showCancelDialog = false,
                            cancelReason = "",
                            successMessage = result.data.message ?: "Đã hủy đơn thành công"
                        )
                    }
                    loadDetail()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isCancelling = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }
}
