package com.court.sportcourt.ui.payment

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentResultScreen(
    onNavigateToBookingDetail: (bookingId: Long) -> Unit,
    onNavigateToMyBookings: () -> Unit,
    onNavigateToHome: () -> Unit,
    viewModel: PaymentResultViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val lifecycleOwner = LocalLifecycleOwner.current

    // Tự động kiểm tra & cập nhật lại kết quả khi quay lại App từ Chrome (ON_RESUME)
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                viewModel.loadPaymentResult()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kết quả thanh toán 💳", fontWeight = FontWeight.Bold) },
                actions = {
                    TextButton(onClick = { viewModel.loadPaymentResult() }) {
                        Text("🔄 Tải lại", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { innerPadding ->
        if (state.isLoading && state.payment == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.payment == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🚫 Không tìm thấy thông tin giao dịch", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onNavigateToHome) {
                        Text("Về trang chủ")
                    }
                }
            }
        } else {
            val payment = state.payment!!
            val isSuccess = payment.status == "SUCCEEDED"

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(12.dp))

                // Thẻ Thông báo Kết quả
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSuccess)
                            MaterialTheme.colorScheme.primaryContainer
                        else
                            MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isSuccess) "🎉" else "🔴",
                            style = MaterialTheme.typography.displayMedium
                        )

                        Spacer(Modifier.height(12.dp))

                        Text(
                            text = if (isSuccess) "Thanh toán thành công!" else "Thanh toán chưa hoàn tất!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isSuccess) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = if (isSuccess)
                                "Giao dịch VNPay đã được xác nhận. Đơn đặt sân của bạn đã được cập nhật thành công!"
                            else
                                "Giao dịch bị hủy hoặc đang trong quá trình xử lý trên VNPay. Hệ thống đang tự động cập nhật khi bạn hoàn tất.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isSuccess) MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f)
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Thẻ Chi tiết Giao dịch
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "🧾 Chi tiết giao dịch",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Mã giao dịch:")
                            Text("#${payment.id}", fontWeight = FontWeight.Bold)
                        }

                        if (!payment.bookingCode.isNullOrBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Mã đơn đặt sân:")
                                Text(payment.bookingCode, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            }
                        }

                        Spacer(Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Số tiền thanh toán:")
                            Text(
                                currencyFormatter.format(payment.amount),
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Cổng thanh toán:")
                            Text("${payment.provider ?: "VNPAY"} (${payment.method ?: "GATEWAY"})")
                        }

                        if (!payment.providerTransactionId.isNullOrBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Mã giao dịch VNPay:")
                                Text(payment.providerTransactionId, fontWeight = FontWeight.Medium)
                            }
                        }

                        if (!payment.paidAt.isNullOrBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Thời gian thanh toán:")
                                Text(payment.paidAt)
                            }
                        }
                    }
                }

                Spacer(Modifier.height(28.dp))

                // Các Nút Điều Hướng Nhanh
                if (payment.bookingId != null) {
                    Button(
                        onClick = { onNavigateToBookingDetail(payment.bookingId) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("📋 Xem chi tiết đơn hàng vừa đặt", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }

                    Spacer(Modifier.height(10.dp))
                }

                Button(
                    onClick = onNavigateToMyBookings,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📅 Lịch đặt của tôi", fontWeight = FontWeight.Bold)
                }

                Spacer(Modifier.height(10.dp))

                OutlinedButton(
                    onClick = onNavigateToHome,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("🏠 Về trang chủ", fontWeight = FontWeight.Bold)
                }

                Spacer(Modifier.height(16.dp))
            }
        }
    }
}
