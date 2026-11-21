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
    val otp: String = "", val emailToken: String = "", val otpMessage: String = "",
    val otpDialogOpen: Boolean = false
)

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()
    private var retryAt = 0L

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

        sendOtp()
    }

    fun confirmOtp() {
        val state = _uiState.value
        if (state.isLoading || !state.otpDialogOpen || state.otp.length != 6) return
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            var token = state.emailToken
            if (token.isBlank()) {
                when (val proof = authRepository.emailOtp(state.email.trim(), state.otp)) {
                    is ApiResult.Error -> {
                        _uiState.update { it.copy(isLoading = false, errorMessage = proof.message) }
                        return@launch
                    }
                    is ApiResult.Success -> token = proof.data
                }
                _uiState.update { it.copy(emailToken = token) }
            }
            val result = authRepository.register(
                fullName = state.fullName,
                email = state.email,
                phone = state.phone,
                password = state.password,
                emailToken = token
            )
            when (result) {
                is ApiResult.Success ->
                    _uiState.update { it.copy(isLoading = false, registered = true, otpDialogOpen = false) }

                is ApiResult.Error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = result.message) }
            }
        }
    }

    // Kiểm tra nhanh phía ứng dụng cho người dùng đỡ chờ; backend vẫn kiểm tra lại đầy đủ
    private fun validate(state: RegisterUiState): String? = when {
        state.fullName.isBlank() -> "Vui lòng nhập họ tên"
        state.email.isBlank() -> "Email là bắt buộc"
        !android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches() -> "Email không hợp lệ"
        state.fullName.trim().length > 150 -> "Họ tên tối đa 150 ký tự"
        state.email.trim().length > 255 -> "Email tối đa 255 ký tự"
        state.phone.isNotBlank() && !Regex("^(\\+84|0)\\d{9,10}$").matches(state.phone.replace(" ", "")) -> "Số điện thoại không hợp lệ"
        state.password.length < 8 -> "Mật khẩu phải từ 8 ký tự"
        state.password.isBlank() -> "Mật khẩu không được chỉ chứa khoảng trắng"
        state.password.toByteArray(Charsets.UTF_8).size > 72 -> "Mật khẩu quá dài"
        state.password != state.confirmPassword -> "Mật khẩu nhập lại không khớp"
        else -> null
    }
    fun onOtpChange(value: String) { _uiState.update { it.copy(otp = value.filter(Char::isDigit).take(6)) } }
    fun closeOtp() { if (!_uiState.value.isLoading) _uiState.update { it.copy(otpDialogOpen = false, otp = "", errorMessage = null) } }
    fun sendOtp() {
        val state = _uiState.value
        if (state.isLoading || state.email.isBlank()) return
        if (System.currentTimeMillis() < retryAt) {
            _uiState.update { it.copy(errorMessage = "Vui lòng chờ 60 giây trước khi gửi lại mã.") }
            return
        }
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            when(val result = authRepository.emailOtp(state.email.trim())) {
                is ApiResult.Success -> {
                    retryAt = System.currentTimeMillis() + 60000
                    _uiState.update { it.copy(isLoading = false, otpDialogOpen = true, emailToken = "", otp = "", otpMessage = "Nhập mã 6 số trong email. Kiểm tra cả thư rác; mã có hiệu lực 5 phút.") }
                }
                is ApiResult.Error -> _uiState.update { it.copy(isLoading=false,errorMessage=result.message) }
            }
        }
    }
}
