package com.court.sportcourt.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RegisterUiState(
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val registered: Boolean = false,
    val otp: String = "", val emailToken: String = "", val otpMessage: String = ""
)

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    fun onFullNameChange(value: String) {
        _uiState.update { it.copy(fullName = value, errorMessage = null) }
    }

    fun onEmailChange(value: String) {
        _uiState.update { it.copy(email = value, emailToken = "", otp = "", errorMessage = null) }
    }

    fun onPhoneChange(value: String) {
        _uiState.update { it.copy(phone = value, errorMessage = null) }
    }

    fun onPasswordChange(value: String) {
        _uiState.update { it.copy(password = value, errorMessage = null) }
    }

    fun onConfirmPasswordChange(value: String) {
        _uiState.update { it.copy(confirmPassword = value, errorMessage = null) }
    }

    fun register() {
        val state = _uiState.value
        if (state.isLoading) return

        val error = validate(state)
        if (error != null) {
            _uiState.update { it.copy(errorMessage = error) }
            return
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val result = authRepository.register(
                fullName = state.fullName,
                email = state.email,
                phone = state.phone,
                password = state.password,
                emailToken = state.emailToken
            )
            when (result) {
                is ApiResult.Success ->
                    _uiState.update { it.copy(isLoading = false, registered = true) }

                is ApiResult.Error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
            }
        }
    }

    // Kiểm tra nhanh phía ứng dụng cho người dùng đỡ chờ; backend vẫn kiểm tra lại đầy đủ
    private fun validate(state: RegisterUiState): String? = when {
        state.fullName.isBlank() -> "Vui lòng nhập họ tên"
        state.email.isBlank() -> "Email là bắt buộc"
        state.emailToken.isBlank() -> "Vui lòng xác minh OTP email trước"
        state.password.length < 8 -> "Mật khẩu phải từ 8 ký tự"
        state.password != state.confirmPassword -> "Mật khẩu nhập lại không khớp"
        else -> null
    }
    fun onOtpChange(value: String) { _uiState.update { it.copy(otp = value.filter(Char::isDigit).take(6)) } }
    fun emailOtp(verify: Boolean) {
        val state = _uiState.value
        if (state.isLoading || state.email.isBlank()) return
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when(val result = authRepository.emailOtp(state.email, if(verify) state.otp else null)) {
                is ApiResult.Success -> _uiState.update { if(it.email == state.email) it.copy(isLoading = false, emailToken = result.data, otpMessage = if(verify) "Đã xác minh email" else "Nếu email đủ điều kiện, mã đã gửi. Chờ 60 giây để gửi lại.") else it.copy(isLoading=false) }
                is ApiResult.Error -> _uiState.update { it.copy(isLoading=false,errorMessage=result.message) }
            }
        }
    }
}
