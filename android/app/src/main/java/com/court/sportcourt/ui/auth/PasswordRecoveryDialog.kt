package com.court.sportcourt.ui.auth
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.court.sportcourt.data.repository.ApiResult
import com.court.sportcourt.ui.components.PasswordTextField
import kotlinx.coroutines.launch

@Composable
fun PasswordRecoveryDialog(model: LoginViewModel, onClose: () -> Unit) {
 var email by remember { mutableStateOf("") }; var code by remember { mutableStateOf("") }
 var token by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }
 var confirm by remember { mutableStateOf("") }; var message by remember { mutableStateOf("") }
 var busy by remember { mutableStateOf(false) }; var done by remember { mutableStateOf(false) }
 val scope=rememberCoroutineScope()
 AlertDialog(onDismissRequest={if(!busy)onClose()}, title={Text("Quên mật khẩu")}, text={Column(Modifier.verticalScroll(rememberScrollState())) {
  if(!done) {
   OutlinedTextField(value=email,onValueChange={email=it;token=""},label={Text("Email tài khoản")},enabled=!busy)
   TextButton(enabled=!busy && email.isNotBlank(), onClick={busy=true;scope.launch {
    when(val r=model.recovery(email)) {is ApiResult.Success->{token="";message="Nếu email đủ điều kiện, mã đã được gửi. Chờ 60 giây để gửi lại."}; is ApiResult.Error->message=r.message};busy=false
   }}) {Text("Gửi / gửi lại OTP")}
   OutlinedTextField(value=code,onValueChange={code=it.filter(Char::isDigit).take(6)},label={Text("OTP 6 số")},enabled=!busy)
   TextButton(enabled=!busy && code.length==6,onClick={busy=true;scope.launch {
    when(val r=model.recovery(email,code)) {is ApiResult.Success->{token=r.data;message="Email đã xác minh"};is ApiResult.Error->message=r.message};busy=false
   }}) {Text("Xác minh OTP")}
   PasswordTextField(value=password,onValueChange={password=it},label="Mật khẩu mới",enabled=!busy)
   Spacer(Modifier.height(8.dp))
   PasswordTextField(value=confirm,onValueChange={confirm=it},label="Nhập lại mật khẩu",enabled=!busy)
  }
  Text(message)
 }}, confirmButton={if(!done) TextButton(enabled=!busy && token.isNotBlank(),onClick={
   if(password.length<8 || password!=confirm) message="Mật khẩu tối thiểu 8 ký tự và nhập lại phải khớp"
   else {busy=true;scope.launch {when(val r=model.resetEmailPassword(email,token,password)) {is ApiResult.Success->{done=true;password="";confirm="";token="";message=r.data};is ApiResult.Error->message=r.message};busy=false}}
  }) {Text("Đặt lại mật khẩu")}},dismissButton={TextButton(enabled=!busy,onClick=onClose){Text("Đóng")}})
}
