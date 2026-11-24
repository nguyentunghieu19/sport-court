package com.court.sportcourt.ui.auth

import android.util.Patterns
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.ui.components.PasswordTextField
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private enum class RecoveryStep { EMAIL, OTP, PASSWORD, DONE }

@Composable
fun PasswordRecoveryDialog(model: LoginViewModel, onClose: () -> Unit) {
    PasswordRecoveryDialog(
        onRequestOtp = { email -> model.recovery(email) },
        onVerifyOtp = { email, code -> model.recovery(email, code) },
        onResetPassword = model::resetEmailPassword,
        onClose = onClose
    )
}

@Composable
internal fun PasswordRecoveryDialog(
    onRequestOtp: suspend (String) -> ApiResult<String>,
    onVerifyOtp: suspend (String, String) -> ApiResult<String>,
    onResetPassword: suspend (String, String, String) -> ApiResult<String>,
    onClose: () -> Unit
) {
    var step by remember { mutableStateOf(RecoveryStep.EMAIL) }
    var email by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var token by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var resendSeconds by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    LaunchedEffect(resendSeconds) {
        if (resendSeconds > 0) {
            delay(1_000)
            resendSeconds--
        }
    }

    fun requestOtp() {
        if (busy) return
        val address = email.trim()
        if (!Patterns.EMAIL_ADDRESS.matcher(address).matches()) {
            error = "Vui lòng nhập địa chỉ email hợp lệ."
            return
        }
        focusManager.clearFocus()
        busy = true
        error = null
        scope.launch {
            try {
                when (val result = onRequestOtp(address)) {
                    is ApiResult.Success -> {
                        email = address
                        code = ""
                        token = ""
                        resendSeconds = 60
                        step = RecoveryStep.OTP
                    }
                    is ApiResult.Error -> error = result.message
                }
            } finally {
                busy = false
            }
        }
    }

    fun submit() {
        if (busy) return
        when (step) {
            RecoveryStep.EMAIL -> requestOtp()
            RecoveryStep.OTP -> {
                if (code.length != 6) {
                    error = "Vui lòng nhập đủ 6 chữ số OTP."
                    return
                }
                focusManager.clearFocus()
                busy = true
                error = null
                scope.launch {
                    try {
                        when (val result = onVerifyOtp(email, code)) {
                            is ApiResult.Success -> {
                                if (result.data.isBlank()) {
                                    error = "Chưa xác minh được OTP. Vui lòng thử lại."
                                } else {
                                    token = result.data
                                    code = ""
                                    step = RecoveryStep.PASSWORD
                                }
                            }
                            is ApiResult.Error -> error = result.message
                        }
                    } finally {
                        busy = false
                    }
                }
            }
            RecoveryStep.PASSWORD -> {
                error = when {
                    password.length < 8 -> "Mật khẩu phải có ít nhất 8 ký tự."
                    password.toByteArray(Charsets.UTF_8).size > 72 -> "Mật khẩu vượt quá 72 byte UTF-8. Vui lòng rút ngắn."
                    password != confirm -> "Mật khẩu nhập lại chưa khớp."
                    else -> null
                }
                if (error != null || token.isBlank()) return
                focusManager.clearFocus()
                busy = true
                scope.launch {
                    try {
                        when (val result = onResetPassword(email, token, password)) {
                            is ApiResult.Success -> {
                                password = ""
                                confirm = ""
                                token = ""
                                step = RecoveryStep.DONE
                            }
                            is ApiResult.Error -> error = result.message
                        }
                    } finally {
                        busy = false
                    }
                }
            }
            RecoveryStep.DONE -> onClose()
        }
    }

    AlertDialog(
        onDismissRequest = { if (!busy) onClose() },
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        title = { Text(if (step == RecoveryStep.DONE) "Đổi mật khẩu thành công" else "Quên mật khẩu") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                when (step) {
                    RecoveryStep.EMAIL -> {
                        Text("Bước 1/3 · Nhập email tài khoản để nhận mã OTP.")
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it; error = null },
                            label = { Text("Email tài khoản") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            enabled = !busy,
                            isError = error != null,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = { submit() })
                        )
                    }
                    RecoveryStep.OTP -> {
                        Text("Bước 2/3 · Nhập mã OTP 6 số được gửi đến $email. Kiểm tra cả thư mục spam.")
                        OutlinedTextField(
                            value = code,
                            onValueChange = { value -> code = value.filter { it in '0'..'9' }.take(6); error = null },
                            label = { Text("OTP 6 số") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            enabled = !busy,
                            isError = error != null,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = { submit() })
                        )
                        TextButton(onClick = ::requestOtp, enabled = !busy && resendSeconds == 0) {
                            Text(if (resendSeconds > 0) "Gửi lại OTP sau ${resendSeconds}s" else "Gửi lại OTP")
                        }
                        TextButton(
                            enabled = !busy,
                            onClick = {
                                step = RecoveryStep.EMAIL
                                code = ""
                                token = ""
                                error = null
                            }
                        ) { Text("Đổi email") }
                    }
                    RecoveryStep.PASSWORD -> {
                        Text("Bước 3/3 · Email đã được xác minh. Tạo mật khẩu mới có ít nhất 8 ký tự.")
                        PasswordTextField(
                            value = password,
                            onValueChange = { password = it; error = null },
                            label = "Mật khẩu mới",
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !busy
                        )
                        PasswordTextField(
                            value = confirm,
                            onValueChange = { confirm = it; error = null },
                            label = "Nhập lại mật khẩu",
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !busy
                        )
                    }
                    RecoveryStep.DONE -> Text("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.")
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
        },
        confirmButton = {
            Button(
                onClick = ::submit,
                enabled = !busy && when (step) {
                    RecoveryStep.EMAIL -> email.isNotBlank()
                    RecoveryStep.OTP -> code.length == 6
                    RecoveryStep.PASSWORD -> password.isNotEmpty() && confirm.isNotEmpty()
                    RecoveryStep.DONE -> true
                }
            ) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(when (step) {
                        RecoveryStep.EMAIL -> "OK"
                        RecoveryStep.OTP -> "Xác minh OTP"
                        RecoveryStep.PASSWORD -> "Đặt lại mật khẩu"
                        RecoveryStep.DONE -> "Đăng nhập"
                    })
                }
            }
        },
        dismissButton = {
            if (step != RecoveryStep.DONE) {
                TextButton(enabled = !busy, onClick = onClose) { Text("Hủy") }
            }
        }
    )
}
