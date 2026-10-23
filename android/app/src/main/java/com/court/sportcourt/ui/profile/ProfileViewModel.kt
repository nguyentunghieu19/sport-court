package com.court.sportcourt.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val isLoading: Boolean = false,
    val isSavingProfile: Boolean = false,
    val isChangingPassword: Boolean = false,
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val role: String = "",
    val oldPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val showChangePasswordDialog: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when (val result = userRepository.getProfile()) {
                is ApiResult.Success -> {
                    val profile = result.data
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            fullName = profile.fullName,
                            email = profile.email ?: "",
                            phone = profile.phone ?: "",
                            role = profile.role
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = result.message)
                    }
                }
            }
        }
    }

    fun onFullNameChange(value: String) {
        _uiState.update { it.copy(fullName = value, errorMessage = null, successMessage = null) }
    }

    fun onEmailChange(value: String) {
        _uiState.update { it.copy(email = value, errorMessage = null, successMessage = null) }
    }

    fun onPhoneChange(value: String) {
        _uiState.update { it.copy(phone = value, errorMessage = null, successMessage = null) }
    }

    fun updateProfile() {
        val state = _uiState.value
        if (state.fullName.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Họ và tên không được để trống") }
            return
        }

        _uiState.update { it.copy(isSavingProfile = true, errorMessage = null, successMessage = null) }
        viewModelScope.launch {
            val result = userRepository.updateProfile(
                fullName = state.fullName,
                email = state.email,
                phone = state.phone
            )
            when (result) {
                is ApiResult.Success -> {
                    val updated = result.data
                    _uiState.update {
                        it.copy(
                            isSavingProfile = false,
                            fullName = updated.fullName,
                            email = updated.email ?: "",
                            phone = updated.phone ?: "",
                            successMessage = "Cập nhật hồ sơ thành công"
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isSavingProfile = false, errorMessage = result.message)
                    }
                }
            }
        }
    }

    fun onOldPasswordChange(value: String) {
        _uiState.update { it.copy(oldPassword = value, errorMessage = null) }
    }

    fun onNewPasswordChange(value: String) {
        _uiState.update { it.copy(newPassword = value, errorMessage = null) }
    }

    fun onConfirmPasswordChange(value: String) {
        _uiState.update { it.copy(confirmPassword = value, errorMessage = null) }
    }

    fun toggleChangePasswordDialog(show: Boolean) {
        _uiState.update {
            it.copy(
                showChangePasswordDialog = show,
                oldPassword = "",
                newPassword = "",
                confirmPassword = "",
                errorMessage = null
            )
        }
    }

    fun changePassword() {
        val state = _uiState.value
        if (state.oldPassword.isBlank() || state.newPassword.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Vui lòng nhập đầy đủ mật khẩu cũ và mới") }
            return
        }
        if (state.newPassword.length < 6) {
            _uiState.update { it.copy(errorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự") }
            return
        }
        if (state.newPassword != state.confirmPassword) {
            _uiState.update { it.copy(errorMessage = "Xác nhận mật khẩu mới không khớp") }
            return
        }

        _uiState.update { it.copy(isChangingPassword = true, errorMessage = null) }
        viewModelScope.launch {
            val result = userRepository.changePassword(
                oldPassword = state.oldPassword,
                newPassword = state.newPassword
            )
            when (result) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isChangingPassword = false,
                            showChangePasswordDialog = false,
                            oldPassword = "",
                            newPassword = "",
                            confirmPassword = "",
                            successMessage = "Đổi mật khẩu thành công"
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isChangingPassword = false, errorMessage = result.message)
                    }
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }
}
