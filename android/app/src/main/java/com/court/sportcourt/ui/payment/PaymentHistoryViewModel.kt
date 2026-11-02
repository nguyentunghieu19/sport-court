package com.court.sportcourt.ui.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.PaymentResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaymentHistoryUiState(
    val isLoading: Boolean = false,
    val payments: List<PaymentResponse> = emptyList(),
    val page: Int = 0,
    val totalPages: Int = 1,
    val errorMessage: String? = null
)

@HiltViewModel
class PaymentHistoryViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PaymentHistoryUiState())
    val uiState: StateFlow<PaymentHistoryUiState> = _uiState.asStateFlow()

    init {
        loadMyPayments(0)
    }

    fun loadMyPayments(page: Int = _uiState.value.page) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = paymentRepository.getMyPayments(page = page, size = 10)) {
                is ApiResult.Success -> {
                    val pageResponse = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            payments = pageResponse.content,
                            page = pageResponse.page,
                            totalPages = if (pageResponse.totalPages > 0) pageResponse.totalPages else 1
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message,
                            payments = emptyList()
                        )
                    }
                }
            }
        }
    }
}
