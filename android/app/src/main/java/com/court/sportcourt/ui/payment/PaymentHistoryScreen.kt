package com.court.sportcourt.ui.payment

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
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
import com.court.sportcourt.data.remote.dto.PaymentResponse
import com.court.sportcourt.ui.components.AppBottomNavigationBar
import com.court.sportcourt.ui.components.NavigationTab
import com.court.sportcourt.ui.customer.CustomerIcon
import com.court.sportcourt.ui.customer.CustomerIconKind
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentHistoryScreen(
    onBack: () -> Unit,
    onPaymentClick: (paymentId: Long) -> Unit,
    onTabSelected: (NavigationTab) -> Unit = {},
    viewModel: PaymentHistoryViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lịch sử thanh toán", fontWeight = FontWeight.SemiBold) },
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
            AppBottomNavigationBar(
                currentTab = NavigationTab.BOOKINGS,
                onTabSelected = onTabSelected
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp)
        ) {
            Spacer(Modifier.height(8.dp))

            if (state.isLoading && state.payments.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.payments.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CustomerIcon(CustomerIconKind.WALLET, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("Chưa có lịch sử giao dịch nào.", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(12.dp))
                        Button(onClick = onBack) {
                            Text("Quay lại")
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(
                        items = state.payments,
                        key = { it.id }
                    ) { payment ->
                        PaymentHistoryItemCard(
                            payment = payment,
                            currencyFormatter = currencyFormatter,
                            onClick = { onPaymentClick(payment.id) }
                        )
                    }

                    item {
                        Spacer(Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentHistoryItemCard(
    payment: PaymentResponse,
    currencyFormatter: NumberFormat,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CustomerIcon(CustomerIconKind.WALLET, modifier = Modifier.padding(end = 12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Giao dịch #${payment.id}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (!payment.bookingCode.isNullOrBlank()) {
                        Text(
                            text = "Đơn sân: ${payment.bookingCode}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                CustomerIcon(CustomerIconKind.ARROW, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            Spacer(Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = currencyFormatter.format(payment.amount),
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Surface(
                    color = when (payment.status) {
                        "SUCCEEDED" -> MaterialTheme.colorScheme.primaryContainer
                        "PENDING" -> MaterialTheme.colorScheme.secondaryContainer
                        else -> MaterialTheme.colorScheme.errorContainer
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = when (payment.status) {
                            "SUCCEEDED" -> "Thành công"
                            "PENDING" -> "Chờ xử lý"
                            else -> "Thất bại"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            Spacer(Modifier.height(12.dp))

            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Hình thức: ${if (payment.paymentType == "DEPOSIT") "Thanh toán Cọc" else "Thanh toán 100%"}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "Cổng: ${payment.provider ?: "VNPAY"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
