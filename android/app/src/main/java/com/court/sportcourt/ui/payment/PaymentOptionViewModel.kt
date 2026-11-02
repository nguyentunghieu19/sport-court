package com.court.sportcourt.ui.payment

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.PaymentUrlResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaymentOptionUiState(
    val bookingId: Long = 0L,
    val totalAmount: Double = 0.0,
    val depositAmount: Double = 0.0,
    val selectedPaymentType: String = "DEPOSIT", // "DEPOSIT" hoặc "FULL"
    val isCreatingPayment: Boolean = false,
    val paymentUrlResponse: PaymentUrlResponse? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class PaymentOptionViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val bookingId: Long = savedStateHandle.get<Long>("bookingId") ?: 0L
    val totalAmount: Double = savedStateHandle.get<Float>("totalAmount")?.toDouble() ?: 0.0
    val depositAmount: Double = savedStateHandle.get<Float>("depositAmount")?.toDouble() ?: 0.0

    private val _uiState = MutableStateFlow(
        PaymentOptionUiState(
            bookingId = bookingId,
            totalAmount = totalAmount,
            depositAmount = depositAmount,
            selectedPaymentType = "DEPOSIT"
        )
    )
    val uiState: StateFlow<PaymentOptionUiState> = _uiState.asStateFlow()

    fun selectPaymentType(type: String) {
        _uiState.update { it.copy(selectedPaymentType = type, errorMessage = null) }
    }

    fun startVnpayPayment(onSuccess: (paymentId: Long, paymentUrl: String) -> Unit) {
        val state = _uiState.value
        if (state.isCreatingPayment) return

        _uiState.update { it.copy(isCreatingPayment = true, errorMessage = null) }
        viewModelScope.launch {
            val result = paymentRepository.createVnpayPayment(
                bookingId = state.bookingId,
                paymentType = state.selectedPaymentType
            )
            when (result) {
                is ApiResult.Success -> {
                    val response = result.data
                    _uiState.update {
                        it.copy(
                            isCreatingPayment = false,
                            paymentUrlResponse = response
                        )
                    }
                    onSuccess(response.paymentId, response.paymentUrl)
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isCreatingPayment = false,
                            errorMessage = result.message
                        )
                    }
                }
            }
        }
    }

    fun clearErrorMessage() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
