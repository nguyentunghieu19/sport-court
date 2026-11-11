package com.court.sportcourt.ui.staff

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import com.court.sportcourt.data.remote.dto.ManagerRefundResponse
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffRefundListScreen(
    venueId: Long? = null,
    viewModel: StaffRefundViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(venueId) {
        viewModel.selectVenueFilter(venueId)
    }

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
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            Text(
                text = "Quản lý Yêu cầu Hoàn tiền 💸",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(Modifier.height(12.dp))

            // Tab Trạng thái Hoàn tiền (Mặc định "Chờ hoàn" PENDING - Theo Bảng #5)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.selectedStatus == "PENDING",
                    onClick = { viewModel.selectStatusFilter("PENDING") },
                    label = { Text("🟡 Chờ hoàn (Mặc định)") },
                    shape = RoundedCornerShape(12.dp)
                )

                FilterChip(
                    selected = state.selectedStatus == "SUCCEEDED",
                    onClick = { viewModel.selectStatusFilter("SUCCEEDED") },
                    label = { Text("🟢 Đã hoàn") },
                    shape = RoundedCornerShape(12.dp)
                )

                FilterChip(
                    selected = state.selectedStatus == "REJECTED",
                    onClick = { viewModel.selectStatusFilter("REJECTED") },
                    label = { Text("🔴 Từ chối") },
                    shape = RoundedCornerShape(12.dp)
                )

                FilterChip(
                    selected = state.selectedStatus == null,
                    onClick = { viewModel.selectStatusFilter(null) },
                    label = { Text("Tất cả") },
                    shape = RoundedCornerShape(12.dp)
                )
            }

            Spacer(Modifier.height(12.dp))

            if (state.isLoading && state.refunds.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.refunds.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🚫 Không có yêu cầu hoàn tiền nào", style = MaterialTheme.typography.titleMedium)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(
                        items = state.refunds,
                        key = { it.id }
                    ) { refund ->
                        StaffRefundItemCard(
                            refund = refund,
                            onCallClick = { phone ->
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                context.startActivity(intent)
                            },
                            onConfirmClick = { viewModel.openConfirmDialog(refund) }
                        )
                    }

                    // Thanh điều khiển Phân Trang
                    item {
                        Spacer(Modifier.height(8.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedButton(
                                    onClick = viewModel::goToPreviousPage,
                                    enabled = state.page > 0 && !state.isLoading,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("‹ Trước", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                                }

                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(
                                        text = "Trang ${state.page + 1} / ${state.totalPages}",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                    )
                                }

                                Button(
                                    onClick = viewModel::goToNextPage,
                                    enabled = state.page < state.totalPages - 1 && !state.isLoading,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Sau ›", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    item {
                        Spacer(Modifier.height(16.dp))
                    }
                }
            }
        }

        // Hộp thoại Xác nhận đã hoàn tiền (Màn #6 - Nhập ghi chú hình thức, mã GD)
        if (state.showConfirmDialog && state.selectedRefundItem != null) {
            val item = state.selectedRefundItem!!
            val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

            AlertDialog(
                onDismissRequest = { viewModel.dismissConfirmDialog() },
                title = { Text("Xác nhận đã hoàn tiền", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Khách hàng: ${item.customerName ?: "Khách lẻ"} (${item.customerPhone ?: ""})", fontWeight = FontWeight.Bold)
                        Text("Số tiền hoàn: ${currencyFormatter.format(item.amount)}", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)

                        Spacer(Modifier.height(10.dp))

                        // Cảnh báo "Không thể hoàn tác" (Theo Bảng yêu cầu #6)
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            )
                        ) {
                            Text(
                                text = "⚠️ Lưu ý: Thao tác xác nhận đã hoàn tiền không thể hoàn tác!",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(8.dp)
                            )
                        }

                        Spacer(Modifier.height(12.dp))

                        OutlinedTextField(
                            value = state.confirmNote,
                            onValueChange = viewModel::onNoteChange,
                            label = { Text("Ghi chú hoàn tiền * (Hình thức, mã GD...)") },
                            placeholder = { Text("Ví dụ: Chuyển khoản MBBank mã MB998877") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = viewModel::confirmRefund,
                        enabled = !state.isConfirming && state.confirmNote.isNotBlank()
                    ) {
                        if (state.isConfirming) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                        } else {
                            Text("Xác nhận đã hoàn tiền")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.dismissConfirmDialog() }) {
                        Text("Bỏ qua")
                    }
                }
            )
        }
    }
}

@Composable
private fun StaffRefundItemCard(
    refund: ManagerRefundResponse,
    onCallClick: (phone: String) -> Unit,
    onConfirmClick: () -> Unit
) {
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val isPending = refund.status == "PENDING"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                    Text(
                        text = "👤 ${refund.customerName ?: "Khách lẻ"}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Đơn sân: ${refund.bookingCode ?: "#${refund.bookingId ?: 0}"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    color = when (refund.status) {
                        "PENDING" -> MaterialTheme.colorScheme.secondaryContainer
                        "SUCCEEDED" -> MaterialTheme.colorScheme.primaryContainer
                        else -> MaterialTheme.colorScheme.errorContainer
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = when (refund.status) {
                            "PENDING" -> "🟡 Chờ hoàn"
                            "SUCCEEDED" -> "🟢 Đã hoàn"
                            else -> "🔴 Từ chối"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = when (refund.status) {
                            "PENDING" -> MaterialTheme.colorScheme.onSecondaryContainer
                            "SUCCEEDED" -> MaterialTheme.colorScheme.onPrimaryContainer
                            else -> MaterialTheme.colorScheme.onErrorContainer
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        maxLines = 1
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Nút Gọi 📞 (Intent.ACTION_DIAL - Theo Bảng yêu cầu #5)
            if (!refund.customerPhone.isNullOrBlank()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📞 SĐT: ${refund.customerPhone}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Button(
                        onClick = { onCallClick(refund.customerPhone) },
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("📞 Gọi khách")
                    }
                }

                Spacer(Modifier.height(10.dp))
            }

            HorizontalDivider()

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                    Text(
                        text = "Lý do: ${refund.reason ?: "Khách hủy đơn"}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    if (!refund.referenceNote.isNullOrBlank()) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Ghi chú hoàn: ${refund.referenceNote}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Text(
                    text = currencyFormatter.format(refund.amount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.error
                )
            }

            // Nút "Đã hoàn tiền" (Theo Bảng yêu cầu #6)
            if (isPending) {
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = onConfirmClick,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("✅ Đã hoàn tiền", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
