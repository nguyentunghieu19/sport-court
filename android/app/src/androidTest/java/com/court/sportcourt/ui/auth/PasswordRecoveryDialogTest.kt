package com.court.sportcourt.ui.auth

import android.graphics.Bitmap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.test.platform.app.InstrumentationRegistry
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.ui.theme.SportcourtTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import java.io.File

class PasswordRecoveryDialogTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun recovery_showsOneStepAtATime_andValidatesBeforeReset() {
        var requestedEmail: String? = null
        var resetArguments: List<String>? = null
        var closed = false
        compose.setContent {
            SportcourtTheme {
                PasswordRecoveryDialog(
                    onRequestOtp = { email -> requestedEmail = email; ApiResult.Success("") },
                    onVerifyOtp = { _, code ->
                        if (code == "123456") ApiResult.Success("verified-token")
                        else ApiResult.Error("OTP không đúng hoặc đã hết hạn")
                    },
                    onResetPassword = { email, token, password ->
                        resetArguments = listOf(email, token, password)
                        ApiResult.Success("Đã đặt lại mật khẩu")
                    },
                    onClose = { closed = true }
                )
            }
        }
        compose.onNodeWithText("Email tài khoản").assertIsDisplayed()
        compose.onNodeWithText("OTP 6 số").assertDoesNotExist()
        compose.onNodeWithText("Mật khẩu mới").assertDoesNotExist()
        screenshot("recovery-1-email")

        compose.onNodeWithText("Email tài khoản").performTextInput("email-sai")
        compose.onNodeWithText("OK").performClick()
        compose.onNodeWithText("Vui lòng nhập địa chỉ email hợp lệ.").assertIsDisplayed()
        compose.runOnIdle { assertNull(requestedEmail) }

        compose.onNodeWithText("Email tài khoản").performTextReplacement(" user@example.com ")
        compose.onNodeWithText("OK").performClick()
        compose.onNodeWithText("OTP 6 số").assertIsDisplayed()
        compose.onNodeWithText("Email tài khoản").assertDoesNotExist()
        compose.onNodeWithText("Mật khẩu mới").assertDoesNotExist()
        compose.runOnIdle { assertEquals("user@example.com", requestedEmail) }
        screenshot("recovery-2-otp")

        compose.onNodeWithText("OTP 6 số").performTextInput("000000")
        compose.onNodeWithText("Xác minh OTP").performClick()
        compose.onNodeWithText("OTP không đúng hoặc đã hết hạn").assertIsDisplayed()
        compose.onNodeWithText("Mật khẩu mới").assertDoesNotExist()

        compose.onNodeWithText("OTP 6 số").performTextReplacement("123456")
        compose.onNodeWithText("Xác minh OTP").performClick()
        compose.onNodeWithText("Mật khẩu mới").assertIsDisplayed()
        compose.onNodeWithText("OTP 6 số").assertDoesNotExist()
        screenshot("recovery-3-password")

        compose.onNodeWithText("Mật khẩu mới").performTextInput("password123")
        compose.onNodeWithText("Nhập lại mật khẩu").performTextInput("different123")
        compose.onNodeWithText("Đặt lại mật khẩu").performClick()
        compose.onNodeWithText("Mật khẩu nhập lại chưa khớp.").assertIsDisplayed()
        compose.runOnIdle { assertNull(resetArguments) }

        compose.onNodeWithText("Nhập lại mật khẩu").performTextReplacement("password123")
        compose.onNodeWithText("Đặt lại mật khẩu").performClick()
        compose.onNodeWithText("Đổi mật khẩu thành công").assertIsDisplayed()
        compose.onNodeWithText("Mật khẩu mới").assertDoesNotExist()
        compose.runOnIdle {
            assertEquals(listOf("user@example.com", "verified-token", "password123"), resetArguments)
        }
        screenshot("recovery-4-success")
        compose.onNodeWithText("Đăng nhập").performClick()
        compose.runOnIdle { assertEquals(true, closed) }
    }

    @Test
    fun requestFailure_staysOnEmail_andAllowsRetryFromKeyboard() {
        var requestCount = 0
        compose.setContent {
            SportcourtTheme {
                PasswordRecoveryDialog(
                    onRequestOtp = {
                        requestCount++
                        if (requestCount == 1) ApiResult.Error("Không kết nối được máy chủ")
                        else ApiResult.Success("")
                    },
                    onVerifyOtp = { _, _ -> ApiResult.Success("") },
                    onResetPassword = { _, _, _ -> error("Must not reset without verification") },
                    onClose = {}
                )
            }
        }
        compose.onNodeWithText("Email tài khoản").performTextInput("user@example.com")
        compose.onNodeWithText("OK").performClick()
        compose.onNodeWithText("Không kết nối được máy chủ").assertIsDisplayed()
        compose.onNodeWithText("OTP 6 số").assertDoesNotExist()
        compose.onNodeWithText("Email tài khoản").performImeAction()
        compose.onNodeWithText("OTP 6 số").assertIsDisplayed()
        compose.onNodeWithText("Xác minh OTP").assertIsNotEnabled()
        compose.onNodeWithText("OTP 6 số").performTextInput("123456")
        compose.onNodeWithText("Xác minh OTP").performClick()
        compose.onNodeWithText("Chưa xác minh được OTP. Vui lòng thử lại.").assertIsDisplayed()
        compose.onNodeWithText("Mật khẩu mới").assertDoesNotExist()
        compose.onNodeWithText("Đổi email").performClick()
        compose.onNodeWithText("Email tài khoản").assertIsDisplayed()
        compose.onNodeWithText("OTP 6 số").assertDoesNotExist()
    }

    private fun screenshot(name: String) {
        compose.waitForIdle()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val directory = File(instrumentation.targetContext.getExternalFilesDir(null), "ui-review")
        directory.mkdirs()
        val bitmap = instrumentation.uiAutomation.takeScreenshot()
        File(directory, "$name.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }
}
