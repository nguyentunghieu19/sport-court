package com.court.sportcourt.ui.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.remote.dto.ManagerRefundResponse
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.ManageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StaffRefundUiState(
    val isLoading: Boolean = false,
    val selectedStatus: String? = "PENDING", // Mặc định "Chờ hoàn" (Theo Bảng yêu cầu #5)
    val refunds: List<ManagerRefundResponse> = emptyList(),
    val selectedRefundItem: ManagerRefundResponse? = null,
    val confirmNote: String = "",
    val showConfirmDialog: Boolean = false,
    val isConfirming: Boolean = false,
    val page: Int = 0,
    val totalPages: Int = 1,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class StaffRefundViewModel @Inject constructor(
    private val manageRepository: ManageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffRefundUiState())
    val uiState: StateFlow<StaffRefundUiState> = _uiState.asStateFlow()

    init {
        loadRefunds(0)
    }

    fun selectStatusFilter(status: String?) {
        _uiState.update { it.copy(selectedStatus = status) }
        loadRefunds(0)
    }

    fun goToPage(targetPage: Int) {
        val state = _uiState.value
        if (state.isLoading || targetPage < 0 || targetPage >= state.totalPages) return
        loadRefunds(targetPage)
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

    fun loadRefunds(page: Int = _uiState.value.page) {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val state = _uiState.value
            val result = manageRepository.getManageRefunds(
                status = state.selectedStatus,
                page = page,
                size = 10
            )
            when (result) {
                is ApiResult.Success -> {
                    val pageResponse = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            refunds = pageResponse.content,
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
                            refunds = emptyList()
                        )
                    }
                }
            }
        }
    }

    fun openConfirmDialog(item: ManagerRefundResponse) {
        _uiState.update {
            it.copy(
                selectedRefundItem = item,
                confirmNote = "",
                showConfirmDialog = true,
                errorMessage = null
            )
        }
    }

    fun onNoteChange(value: String) {
        _uiState.update { it.copy(confirmNote = value, errorMessage = null) }
    }

    fun dismissConfirmDialog() {
        _uiState.update {
            it.copy(
                showConfirmDialog = false,
                selectedRefundItem = null,
                confirmNote = "",
                errorMessage = null
            )
        }
    }

    fun confirmRefund() {
        val state = _uiState.value
        val item = state.selectedRefundItem ?: return
        if (state.confirmNote.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Vui lòng nhập ghi chú hoàn tiền (hình thức, mã giao dịch)") }
            return
        }

        _uiState.update { it.copy(isConfirming = true, errorMessage = null) }
        viewModelScope.launch {
            val result = manageRepository.confirmRefund(item.id, state.confirmNote)
            when (result) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isConfirming = false,
                            showConfirmDialog = false,
                            confirmNote = "",
                            selectedRefundItem = null,
                            successMessage = "Xác nhận đã hoàn tiền thành công"
                        )
                    }
                    loadRefunds()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isConfirming = false,
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
