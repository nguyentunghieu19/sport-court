package com.court.sportcourt.ui.staff

import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.court.sportcourt.data.remote.dto.ManagerBookingResponse
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffBookingListScreen(
    onBookingClick: (bookingId: Long) -> Unit,
    viewModel: StaffBookingViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Ô tìm kiếm (Mã đơn, tên khách, số điện thoại)
        OutlinedTextField(
            value = state.keyword,
            onValueChange = viewModel::onKeywordChange,
            label = { Text("🔍 Tìm mã đơn, tên, sđt khách...") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(Modifier.height(12.dp))

        // Bộ lọc Trạng thái đơn
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = state.selectedStatus == null,
                onClick = { viewModel.selectStatusFilter(null) },
                label = { Text("Tất cả") },
                shape = RoundedCornerShape(12.dp)
            )

            FilterChip(
                selected = state.selectedStatus == "PENDING_PAYMENT",
                onClick = { viewModel.selectStatusFilter("PENDING_PAYMENT") },
                label = { Text("🟡 Chờ cọc") },
                shape = RoundedCornerShape(12.dp)
            )

            FilterChip(
                selected = state.selectedStatus == "CONFIRMED",
                onClick = { viewModel.selectStatusFilter("CONFIRMED") },
                label = { Text("🟢 Đã xác nhận") },
                shape = RoundedCornerShape(12.dp)
            )

            FilterChip(
                selected = state.selectedStatus == "CANCELLED",
                onClick = { viewModel.selectStatusFilter("CANCELLED") },
                label = { Text("🔴 Đã hủy") },
                shape = RoundedCornerShape(12.dp)
            )
        }

        Spacer(Modifier.height(12.dp))

        if (state.isLoading && state.bookings.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.bookings.isEmpty()) {
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
                    Text("🚫 Không tìm thấy đơn đặt sân nào", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Thử thay đổi từ khóa hoặc bộ lọc",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = state.bookings,
                    key = { it.booking.id }
                ) { managerBooking ->
                    StaffBookingItemCard(
                        item = managerBooking,
                        onClick = { onBookingClick(managerBooking.booking.id) }
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
}

@Composable
private fun StaffBookingItemCard(
    item: ManagerBookingResponse,
    onClick: () -> Unit
) {
    val booking = item.booking
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val hasPendingRefund = item.pendingRefundAmount > 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
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
                        text = booking.bookingCode,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "👤 ${item.customerName ?: "Khách lẻ"}${if (!item.customerPhone.isNullOrBlank()) " (${item.customerPhone})" else ""}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Nhãn "Chờ hoàn" nếu pendingRefundAmount > 0 (Theo Bảng yêu cầu #2)
                    if (hasPendingRefund) {
                        Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "💸 Chờ hoàn",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                maxLines = 1
                            )
                        }
                    }

                    Surface(
                        color = when (booking.status) {
                            "PENDING_PAYMENT" -> MaterialTheme.colorScheme.secondaryContainer
                            "CONFIRMED" -> MaterialTheme.colorScheme.primaryContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = when (booking.status) {
                                "PENDING_PAYMENT" -> "🟡 Chờ cọc"
                                "CONFIRMED" -> "🟢 Đã xác nhận"
                                else -> "🔴 Đã hủy"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = when (booking.status) {
                                "PENDING_PAYMENT" -> MaterialTheme.colorScheme.onSecondaryContainer
                                "CONFIRMED" -> MaterialTheme.colorScheme.onPrimaryContainer
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            maxLines = 1
                        )
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            Text(
                text = "🏟️ ${booking.venueName ?: "Cụm sân"} - ${booking.fieldName ?: "Sân"}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = "⏱️ Ngày ${booking.date ?: ""} (${booking.startTime ?: ""} - ${booking.endTime ?: ""})",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(10.dp))

            HorizontalDivider()

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                    Text(
                        text = "Đã trả: ${currencyFormatter.format(item.paidAmount)}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (item.outstandingAmount > 0) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Thu thêm tại sân: ${currencyFormatter.format(item.outstandingAmount)}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }

                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = "Chi tiết →",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        maxLines = 1
                    )
                }
            }
        }
    }
}
