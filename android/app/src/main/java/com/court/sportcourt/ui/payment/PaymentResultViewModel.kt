package com.court.sportcourt.ui.payment

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.PaymentResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaymentResultUiState(
    val isLoading: Boolean = false,
    val payment: PaymentResponse? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class PaymentResultViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val paymentId: Long = savedStateHandle.get<Long>("paymentId") ?: 0L
    private var pollingJob: Job? = null

    private val _uiState = MutableStateFlow(PaymentResultUiState())
    val uiState: StateFlow<PaymentResultUiState> = _uiState.asStateFlow()

    init {
        loadPaymentResult()
    }

    fun loadPaymentResult() {
        pollingJob?.cancel()
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = paymentRepository.getPaymentDetail(paymentId)) {
                is ApiResult.Success -> {
                    val payment = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            payment = payment
                        )
                    }
                    if (payment.status == "PENDING") {
                        startAutoPolling()
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

    private fun startAutoPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            repeat(15) {
                delay(2000)
                when (val result = paymentRepository.getPaymentDetail(paymentId)) {
                    is ApiResult.Success -> {
                        val updated = result.data
                        _uiState.update { it.copy(payment = updated) }
                        if (updated.status != "PENDING") {
                            return@launch
                        }
                    }
                    is ApiResult.Error -> {}
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
