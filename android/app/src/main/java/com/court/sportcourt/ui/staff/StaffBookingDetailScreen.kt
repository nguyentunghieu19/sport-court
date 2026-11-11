package com.court.sportcourt.ui.staff

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffBookingDetailScreen(
    onBack: () -> Unit,
    viewModel: StaffBookingDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

    LaunchedEffect(state.errorMessage, state.successMessage) {
        state.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
        state.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quản lý chi tiết đơn", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("← Quay lại")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.managerBooking == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🚫 Không tìm thấy chi tiết đơn hàng", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onBack) {
                        Text("Quay lại")
                    }
                }
            }
        } else {
            val item = state.managerBooking!!
            val booking = item.booking

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // Thẻ Thông tin Khách hàng & Nút Gọi 📞 (Intent.ACTION_DIAL)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "👤 ${item.customerName ?: "Khách lẻ"}",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                if (!item.customerPhone.isNullOrBlank()) {
                                    Text(
                                        text = "📞 SĐT: ${item.customerPhone}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                if (!item.customerEmail.isNullOrBlank()) {
                                    Text(
                                        text = "✉️ Email: ${item.customerEmail}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                }
                            }

                            // Nút Gọi điện thoại trực tiếp (Intent.ACTION_DIAL - Không cần xin quyền)
                            if (!item.customerPhone.isNullOrBlank()) {
                                Button(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${item.customerPhone}"))
                                        context.startActivity(intent)
                                    },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("📞 Gọi")
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Thẻ Thông tin Đơn đặt sân
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = booking.bookingCode,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )

                            Surface(
                                color = when (booking.status) {
                                    "PENDING_PAYMENT" -> MaterialTheme.colorScheme.secondaryContainer
                                    "CONFIRMED" -> MaterialTheme.colorScheme.primaryContainer
                                    else -> MaterialTheme.colorScheme.errorContainer
                                },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = when (booking.status) {
                                        "PENDING_PAYMENT" -> "🟡 Chờ cọc"
                                        "CONFIRMED" -> "🟢 Đã xác nhận"
                                        else -> "🔴 Đã hủy"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(8.dp))

                        HorizontalDivider()

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = "${booking.venueName ?: "Cụm sân"} - ${booking.fieldName ?: "Sân"}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(Modifier.height(4.dp))

                        Text(
                            text = "📅 Ngày chơi: ${booking.date ?: ""}",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        Text(
                            text = "⏱️ Khung giờ: ${booking.startTime ?: ""} - ${booking.endTime ?: ""}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Khối Tiền: Đã trả, Còn phải thu, Đang chờ hoàn, Đã hoàn (Theo Bảng yêu cầu #3)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "💰 Quản lý dòng tiền",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Tổng tiền đơn:")
                            Text(currencyFormatter.format(booking.totalAmount), fontWeight = FontWeight.Bold)
                        }

                        Spacer(Modifier.height(6.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Đã trả:")
                            Text(currencyFormatter.format(item.paidAmount), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }

                        Spacer(Modifier.height(6.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Còn phải thu tại sân:")
                            Text(currencyFormatter.format(item.outstandingAmount), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.tertiary)
                        }

                        Spacer(Modifier.height(6.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Đang chờ hoàn:")
                            Text(currencyFormatter.format(item.pendingRefundAmount), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                        }

                        Spacer(Modifier.height(6.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Đã hoàn xong:")
                            Text(currencyFormatter.format(item.refundedAmount), fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Khối Các Nút Hành Động Nghiệp Vụ Vận Hành Sân (Chuẩn Điều Kiện Backend)
                Text("🛠️ Thao tác vận hành sân", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))

                // Trạng thái / Nút Check-in
                if (!item.checkedInAt.isNullOrBlank()) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "🟢 Đã check-in cho khách lúc ${item.checkedInAt.take(16).replace("T", " ")}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                } else if (booking.status == "CONFIRMED") {
                    Button(
                        onClick = viewModel::checkInBooking,
                        enabled = !state.isProcessingAction,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("📲 Check-in cho khách (30p trước giờ chơi)", fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(10.dp))
                }

                // Nút Thu tiền tại sân (Chỉ thu khi đã check-in hoặc hoàn thành)
                if (item.outstandingAmount > 0) {
                    val canPayOnsite = !item.checkedInAt.isNullOrBlank() || booking.status == "COMPLETED"
                    Button(
                        onClick = { viewModel.togglePaymentDialog(true, "CASH") },
                        enabled = !state.isProcessingAction && canPayOnsite,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (canPayOnsite) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Text(
                            text = "💵 Thu tiền còn nợ (${currencyFormatter.format(item.outstandingAmount)})",
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (!canPayOnsite) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "⚠️ Theo quy định, cần bấm 'Check-in cho khách' trước khi thu tiền tại sân.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    Spacer(Modifier.height(10.dp))
                }

                // Nút Hoàn thành & Vắng mặt
                if (booking.status == "CONFIRMED") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (!item.checkedInAt.isNullOrBlank()) {
                            Button(
                                onClick = viewModel::completeBooking,
                                enabled = !state.isProcessingAction,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("🎉 Hoàn thành", fontWeight = FontWeight.Bold)
                            }
                        }

                        if (item.checkedInAt.isNullOrBlank()) {
                            OutlinedButton(
                                onClick = viewModel::noShowBooking,
                                enabled = !state.isProcessingAction,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("⚠️ Khách Vắng mặt", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                }

                // Nút "Hủy đơn" (Theo Bảng yêu cầu #4 - Bắt buộc nhập lý do)
                if (booking.status == "PENDING_PAYMENT" || booking.status == "CONFIRMED") {
                    Button(
                        onClick = { viewModel.toggleCancelDialog(true) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("❌ Hủy đơn đặt sân này", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Hộp thoại Thu tiền tại sân (Tiền mặt CASH hoặc Chuyển khoản BANK_TRANSFER)
        if (state.showPaymentDialog) {
            val amount = state.managerBooking?.outstandingAmount ?: 0.0

            AlertDialog(
                onDismissRequest = { viewModel.togglePaymentDialog(false) },
                title = { Text("Ghi nhận thu tiền tại sân 💵", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Số tiền cần thu: ${currencyFormatter.format(amount)}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)

                        Spacer(Modifier.height(14.dp))

                        Text("Chọn hình thức thanh toán:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)

                        Spacer(Modifier.height(8.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = { viewModel.togglePaymentDialog(true, "CASH") },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (state.paymentMethod == "CASH") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("💵 Tiền mặt")
                            }

                            Button(
                                onClick = { viewModel.togglePaymentDialog(true, "BANK_TRANSFER") },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (state.paymentMethod == "BANK_TRANSFER") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("🏦 Chuyển khoản")
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = viewModel::submitOnsitePayment,
                        enabled = !state.isProcessingAction
                    ) {
                        if (state.isProcessingAction) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                        } else {
                            Text("Ghi nhận đã thu đủ")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.togglePaymentDialog(false) }) {
                        Text("Bỏ qua")
                    }
                }
            )
        }

        // Hộp thoại Hủy đơn của Nhân viên (Yêu cầu nhập lý do bắt buộc)
        if (state.showCancelDialog) {
            AlertDialog(
                onDismissRequest = { viewModel.toggleCancelDialog(false) },
                title = { Text("Hủy đơn đặt sân", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Nhập lý do hủy đơn (Bắt buộc):", style = MaterialTheme.typography.bodySmall)
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = state.cancelReason,
                            onValueChange = viewModel::onReasonChange,
                            label = { Text("Lý do hủy đơn *") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = viewModel::cancelBooking,
                        enabled = !state.isCancelling && state.cancelReason.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        if (state.isCancelling) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onError, strokeWidth = 2.dp)
                        } else {
                            Text("Xác nhận hủy")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.toggleCancelDialog(false) }) {
                        Text("Bỏ qua")
                    }
                }
            )
        }
    }
}
