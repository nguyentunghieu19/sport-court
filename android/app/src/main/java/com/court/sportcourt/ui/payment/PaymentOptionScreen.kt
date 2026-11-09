package com.court.sportcourt.ui.payment

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import com.court.sportcourt.ui.customer.CustomerSectionLabel
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentOptionScreen(
    onBack: () -> Unit,
    onOpenPaymentUrl: (paymentId: Long, paymentUrl: String) -> Unit,
    viewModel: PaymentOptionViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

    LaunchedEffect(state.errorMessage) {
        state.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearErrorMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.semantics { contentDescription = "Quay lại" }
                    ) {
                        CustomerIcon(CustomerIconKind.BACK, tint = MaterialTheme.colorScheme.onSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        bottomBar = {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shadowElevation = 0.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Button(
                    onClick = {
                        viewModel.startVnpayPayment { paymentId, paymentUrl ->
                            onOpenPaymentUrl(paymentId, paymentUrl)
                        }
                    },
                    enabled = !state.isCreatingPayment,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    if (state.isCreatingPayment) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        CustomerIcon(CustomerIconKind.WALLET, tint = MaterialTheme.colorScheme.onPrimary)
                        Text("Thanh toán", modifier = Modifier.padding(start = 10.dp), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            // Thẻ Thông tin Đơn hàng
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Đơn đặt sân #${state.bookingId}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onPrimary
                    )

                    Spacer(Modifier.height(20.dp))

                    Column {
                        Text("Tổng giá trị đơn", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimary)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            currencyFormatter.format(state.totalAmount),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            CustomerSectionLabel("Chọn mức tiền thanh toán")

            Spacer(Modifier.height(12.dp))

            // Tùy chọn 1: Thanh toán Tiền Cọc (DEPOSIT)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { viewModel.selectPaymentType("DEPOSIT") },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.selectedPaymentType == "DEPOSIT")
                        MaterialTheme.colorScheme.primaryContainer
                    else
                        MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(1.dp, if (state.selectedPaymentType == "DEPOSIT") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    RadioButton(
                        selected = state.selectedPaymentType == "DEPOSIT",
                        onClick = { viewModel.selectPaymentType("DEPOSIT") }
                    )

                    Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
                        Text(
                            text = "Thanh toán tiền đặt cọc",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Thanh toán cọc để giữ sân, số tiền còn lại sẽ trả tại sân.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = currencyFormatter.format(state.depositAmount),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // Tùy chọn 2: Thanh toán Toàn Bộ (FULL)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { viewModel.selectPaymentType("FULL") },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.selectedPaymentType == "FULL")
                        MaterialTheme.colorScheme.primaryContainer
                    else
                        MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(1.dp, if (state.selectedPaymentType == "FULL") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    RadioButton(
                        selected = state.selectedPaymentType == "FULL",
                        onClick = { viewModel.selectPaymentType("FULL") }
                    )

                    Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
                        Text(
                            text = "Thanh toán 100% toàn bộ sân",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Thanh toán toàn bộ ngay để không cần thanh toán tại sân.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = currencyFormatter.format(state.totalAmount),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Cổng thanh toán VNPay Info
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Bảo mật thanh toán bởi VNPay Gateway",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Hỗ trợ thẻ ATM nội địa (NCB, Vietcombank, Techcombank...), QR Code và Ví điện tử.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
