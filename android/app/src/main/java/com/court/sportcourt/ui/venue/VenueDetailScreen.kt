package com.court.sportcourt.ui.venue

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.court.sportcourt.data.remote.dto.FieldDto

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun VenueDetailScreen(
    onBack: () -> Unit,
    onFieldClick: (fieldId: Long) -> Unit,
    viewModel: VenueDetailViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.snackbarMessage) {
        state.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbarMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết địa điểm", fontWeight = FontWeight.Bold) },
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
        } else if (state.venue == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🚫 Không tìm thấy thông tin địa điểm", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onBack) {
                        Text("Quay lại")
                    }
                }
            }
        } else {
            val venue = state.venue!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // Header Card Thông tin địa điểm
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = venue.name,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = "📍 Địa chỉ: ${venue.address}, ${venue.district ?: ""}${if (!venue.city.isNullOrBlank()) ", ${venue.city}" else ""}",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        Spacer(Modifier.height(6.dp))

                        Text(
                            text = "⏰ Giờ mở cửa: ${venue.openingTime ?: "06:00"} - ${venue.closingTime ?: "22:00"}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )

                        Spacer(Modifier.height(10.dp))

                        // Nhãn các môn thể thao
                        if (venue.sportTypes.isNotEmpty()) {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                venue.sportTypes.forEach { sportCode ->
                                    val displayLabel = when (sportCode) {
                                        "FOOTBALL" -> "Bóng đá"
                                        "BADMINTON" -> "Cầu lông"
                                        "TENNIS" -> "Tennis"
                                        "PICKLEBALL" -> "Pickleball"
                                        "BASKETBALL" -> "Bóng rổ"
                                        else -> sportCode
                                    }
                                    Surface(
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = "🏆 $displayLabel",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Thẻ Chính sách đặt cọc và hủy sân
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "📋 Chính sách & Quy định",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(Modifier.height(8.dp))

                        val policy = venue.policy
                        if (policy != null) {
                            Text(
                                text = "💳 Đặt cọc ${policy.depositPercentage.toInt()}%" +
                                        if (policy.depositRefundableOnCustomerCancel) " (Hoàn cọc khi hủy trước hạn)" else "",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            Text(
                                text = "❌ Hủy miễn phí trước ${policy.cancellationDeadlineHours} giờ" +
                                        if (policy.fullPaymentRefundableBeforeDeadline) " (Hoàn 100% tiền)" else "",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            Text(
                                text = "⏱️ Giữ chỗ ${policy.paymentTimeoutMinutes} phút",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        } else {
                            Text(
                                text = "Áp dụng theo quy định chung của nhà quản lý sân.",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Danh sách sân con
                Text(
                    text = "Danh sách sân (${venue.fields.size} sân)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(Modifier.height(12.dp))

                if (venue.fields.isEmpty()) {
                    Text("Hiện chưa có thông tin danh sách sân con.")
                } else {
                    venue.fields.forEach { field ->
                        FieldItemCard(
                            field = field,
                            onClick = {
                                if (field.status == "MAINTENANCE") {
                                    viewModel.showMaintenanceToast(field.name)
                                } else {
                                    onFieldClick(field.id)
                                }
                            }
                        )
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
}

// Item thẻ Sân con (Thực hiện Note 3: Sân MAINTENANCE hiện "Đang bảo trì")
@Composable
private fun FieldItemCard(
    field: FieldDto,
    onClick: () -> Unit
) {
    val isMaintenance = field.status == "MAINTENANCE"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isMaintenance)
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
            else
                MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = field.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = if (isMaintenance) "Thẻ sân này tạm thời không nhận đặt" else "Nhấn để xem lưới giờ trống & đặt sân",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Note 3: Sân MAINTENANCE hiện "Đang bảo trì"
            Surface(
                color = if (isMaintenance)
                    MaterialTheme.colorScheme.error
                else
                    MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = if (isMaintenance) "🔴 Đang bảo trì" else "🟢 Hoạt động",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (isMaintenance)
                        MaterialTheme.colorScheme.onError
                    else
                        MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }
    }
}
