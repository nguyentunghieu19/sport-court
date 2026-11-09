package com.court.sportcourt.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
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
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.court.sportcourt.ui.customer.CustomerIcon
import com.court.sportcourt.ui.customer.CustomerIconKind
import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingDetailScreen(
    onBack: () -> Unit,
    onNavigateToHome: () -> Unit = {},
    onNavigateToPaymentOption: (bookingId: Long, totalAmount: Double, depositAmount: Double) -> Unit = { _, _, _ -> },
    viewModel: BookingDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
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
                title = { Text("Chi tiết đặt sân", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.semantics { contentDescription = "Quay lại" }) {
                        CustomerIcon(CustomerIconKind.BACK, Modifier.size(20.dp))
                    }
                }
            )
        },
        bottomBar = {
            val booking = state.booking
            if (!state.isLoading && booking != null && booking.status == "PENDING_PAYMENT" && !state.isExpired) {
                Surface(color = MaterialTheme.colorScheme.surface) {
                    Button(
                        onClick = {
                            onNavigateToPaymentOption(booking.id, booking.totalAmount, booking.depositAmount)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(16.dp)
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Thanh toán ngay qua VNPay", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
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
        } else if (state.booking == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CustomerIcon(CustomerIconKind.CALENDAR, Modifier.size(36.dp))
                    Spacer(Modifier.height(16.dp))
                    Text("Không tìm thấy thông tin đơn hàng", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onBack) {
                        Text("Quay lại")
                    }
                }
            }
        } else {
            val booking = state.booking!!

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // Thẻ Đồng hồ đếm ngược 15 phút (Chỉ hiển thị khi đơn đang CHỜ THANH TOÁN CỌC)
                if (booking.status == "PENDING_PAYMENT") {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (state.isExpired)
                                MaterialTheme.colorScheme.errorContainer
                            else
                                MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = if (state.isExpired) "Đã hết thời hạn thanh toán cọc!" else "Thời gian còn lại để giữ sân & cọc:",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Medium,
                                color = if (state.isExpired) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer
                            )

                            Spacer(Modifier.height(8.dp))

                            Text(
                                text = state.formattedCountdown,
                                style = MaterialTheme.typography.headlineLarge,
                                fontWeight = FontWeight.Bold,
                                color = if (state.isExpired) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                }

                // Thẻ Trạng thái Hoàn tiền Khách hàng (Theo Bảng #1 Màn hình Khách USER)
                if (state.refundInfo != null) {
                    val refund = state.refundInfo!!
                    val isRefundSuccess = refund.status == "SUCCEEDED"
                    val formattedCompletedAt = remember(refund.completedAt) {
                        formatUtcToVietnamTime(refund.completedAt)
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isRefundSuccess)
                                MaterialTheme.colorScheme.primaryContainer
                            else
                                MaterialTheme.colorScheme.secondaryContainer
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Trạng thái hoàn tiền",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (isRefundSuccess) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSecondaryContainer
                            )

                            Spacer(Modifier.height(8.dp))

                            Text(
                                text = if (isRefundSuccess)
                                    "Đã hoàn tiền lúc $formattedCompletedAt"
                                else
                                    "Chờ chủ sân hoàn tiền",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isRefundSuccess) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.tertiary
                            )

                            Spacer(Modifier.height(4.dp))

                            Text(
                                text = "Số tiền hoàn: ${currencyFormatter.format(refund.amount)}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )

                            if (!refund.referenceNote.isNullOrBlank()) {
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = "Ghi chú: ${refund.referenceNote}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                }

                // Lịch chơi được ưu tiên, mã đơn nằm ở cuối thẻ.
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CustomerIcon(CustomerIconKind.COURT, Modifier.size(24.dp))

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
                                        "PENDING_PAYMENT" -> "Chờ cọc"
                                        "CONFIRMED" -> "Đã xác nhận"
                                        else -> "Đã hủy"
                                    },
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = when (booking.status) {
                                        "PENDING_PAYMENT" -> MaterialTheme.colorScheme.onSecondaryContainer
                                        "CONFIRMED" -> MaterialTheme.colorScheme.onPrimaryContainer
                                        else -> MaterialTheme.colorScheme.onErrorContainer
                                    },
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        Text(
                            text = booking.venueName ?: "Cụm sân thể thao",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        if (!booking.fieldName.isNullOrBlank()) {
                            Text(
                                text = "Sân: ${booking.fieldName}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(Modifier.height(16.dp))

                        Text(
                            text = "Ngày chơi: ${booking.date}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Text(
                            text = "${booking.startTime} - ${booking.endTime}",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider()
                        Spacer(Modifier.height(12.dp))
                        Text("Mã đơn đặt", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(booking.bookingCode, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)

                        if (!booking.note.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = "Ghi chú: ${booking.note}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Thẻ Chi tiết Tiền cọc & Còn lại
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "Thông tin tiền đặt sân",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Tổng tiền sân", modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(currencyFormatter.format(booking.totalAmount), fontWeight = FontWeight.SemiBold)
                        }

                        Spacer(Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Cần thanh toán cọc", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(
                                currencyFormatter.format(booking.depositAmount),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(Modifier.height(8.dp))

                        HorizontalDivider()

                        Spacer(Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Số tiền còn lại thanh toán tại sân", modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(currencyFormatter.format(booking.remainingAfterDeposit), fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Nút Hủy đơn đặt sân (Chỉ hiện khi status là PENDING_PAYMENT hoặc CONFIRMED)
                if (booking.status == "PENDING_PAYMENT" || booking.status == "CONFIRMED") {
                    OutlinedButton(
                        onClick = { viewModel.loadCancellationPreview() },
                        enabled = !state.isLoadingPreview,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        if (state.isLoadingPreview) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Hủy đơn đặt sân", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Medium)
                        }
                    }

                    Spacer(Modifier.height(12.dp))
                }

                // Nút Quay Về Trang Chủ
                TextButton(
                    onClick = onNavigateToHome,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    CustomerIcon(CustomerIconKind.HOME, Modifier.size(18.dp))
                    Text("Về trang chủ", modifier = Modifier.padding(start = 8.dp), fontWeight = FontWeight.Medium)
                }

                Spacer(Modifier.height(16.dp))
            }
        }

        // Hộp thoại Hủy Đơn Đặt Sân (Cancellation Preview Dialog)
        if (state.showCancelDialog && state.cancellationPreview != null) {
            val preview = state.cancellationPreview!!
            val formattedDeadline = remember(preview.cancelDeadlineAt) {
                formatUtcToVietnamTime(preview.cancelDeadlineAt)
            }

            AlertDialog(
                onDismissRequest = { viewModel.dismissCancelDialog() },
                title = {
                    Text("Xác nhận hủy đơn đặt sân", fontWeight = FontWeight.Bold)
                },
                text = {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState())
                    ) {
                        Text("Mã đơn: ${preview.bookingCode ?: state.booking?.bookingCode ?: ""}", fontWeight = FontWeight.Bold)

                        Spacer(Modifier.height(8.dp))

                        Text("Hạn hủy hoàn tiền: $formattedDeadline", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)

                        Spacer(Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Số tiền đã trả:", modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(currencyFormatter.format(preview.paidAmount), fontWeight = FontWeight.SemiBold)
                        }

                        Spacer(Modifier.height(4.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Số tiền được hoàn:", modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(currencyFormatter.format(preview.refundAmount), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }

                        Spacer(Modifier.height(4.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Khấu trừ không hoàn:", modifier = Modifier.weight(1f).padding(end = 12.dp))
                            Text(currencyFormatter.format(preview.forfeitedAmount), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                        }

                        Spacer(Modifier.height(12.dp))

                        val isNoRefund = preview.paidAmount > 0.0 && preview.refundAmount == 0.0

                        if (isNoRefund) {
                            Spacer(Modifier.height(10.dp))
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.errorContainer
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "Theo chính sách địa điểm, bạn vẫn được quyền hủy đơn để nhả lại sân, nhưng tiền cọc đã thanh toán (${currencyFormatter.format(preview.paidAmount)}) sẽ KHÔNG được hoàn lại.",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                        }

                        if (!preview.message.isNullOrBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = preview.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                        }

                        if (preview.canCancel) {
                            Spacer(Modifier.height(12.dp))
                            OutlinedTextField(
                                value = state.cancelReason,
                                onValueChange = viewModel::onCancelReasonChange,
                                label = { Text("Lý do hủy (không bắt buộc)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                        }
                    }
                },
                confirmButton = {
                    if (preview.canCancel) {
                        Button(
                            onClick = { viewModel.confirmCancelBooking() },
                            enabled = !state.isCancelling,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.error
                            )
                        ) {
                            if (state.isCancelling) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onError, strokeWidth = 2.dp)
                            } else {
                                Text("Xác nhận hủy đơn")
                            }
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.dismissCancelDialog() }) {
                        Text("Đóng")
                    }
                }
            )
        }
    }
}

private fun formatUtcToVietnamTime(utcStr: String?): String {
    if (utcStr.isNullOrBlank()) return "--:--"
    return try {
        val instant = Instant.parse(utcStr)
        val formatter = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"))
        formatter.format(instant)
    } catch (e: Exception) {
        utcStr
    }
}
