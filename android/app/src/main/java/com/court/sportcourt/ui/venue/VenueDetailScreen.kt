package com.court.sportcourt.ui.venue

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.ui.graphics.Color
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
import com.court.sportcourt.data.remote.dto.FieldDto
import com.court.sportcourt.ui.customer.CourtArtwork
import com.court.sportcourt.ui.customer.CustomerIcon
import com.court.sportcourt.ui.customer.CustomerIconKind
import com.court.sportcourt.ui.customer.CustomerSectionLabel

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
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.semantics { contentDescription = "Quay lại" }
                    ) {
                        CustomerIcon(CustomerIconKind.BACK)
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
                    Text("Không tìm thấy thông tin địa điểm", style = MaterialTheme.typography.titleMedium)
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
                        containerColor = Color(0xFFECFDF5)
                    ),
                    border = BorderStroke(1.5.dp, Color(0xFFA7F3D0)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CustomerSectionLabel("ĐỊA ĐIỂM THỂ THAO", modifier = Modifier.weight(1f))
                        CourtArtwork(modifier = Modifier.width(58.dp).height(42.dp))
                    }
                    Column(modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 20.dp)) {
                        Text(
                            text = venue.name,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = "Địa chỉ: ${venue.address}, ${venue.district ?: ""}${if (!venue.city.isNullOrBlank()) ", ${venue.city}" else ""}",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        Spacer(Modifier.height(6.dp))

                        Text(
                            text = "Giờ mở cửa: ${venue.openingTime ?: "06:00"} - ${venue.closingTime ?: "22:00"}",
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
                                            text = "$displayLabel",
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

                // Danh sách sân con
                Text(
                    text = "Chọn sân · ${venue.fields.size} sân",
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

                Spacer(Modifier.height(14.dp))

                // Thẻ Chính sách đặt cọc và hủy sân (Hiển thị đầy đủ 6 trường dữ liệu)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFECFDF5)
                    ),
                    border = BorderStroke(1.5.dp, Color(0xFFA7F3D0)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Chính sách đặt sân",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(Modifier.height(12.dp))

                        val policy = venue.policy
                        if (policy != null) {
                            // 1. Tỷ lệ cọc
                            Text(
                                text = "Mức tiền cọc: ${policy.depositPercentage.toInt()}% tổng giá trị đơn",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )

                            Spacer(Modifier.height(6.dp))

                            // 2. Thời hạn hủy đơn
                            Text(
                                text = "Hạn hủy trước giờ chơi: ${policy.cancellationDeadlineHours} giờ",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            // 3. Hoàn cọc khi khách hủy
                            Text(
                                text = "Hoàn tiền cọc khi khách hủy trước hạn: ${if (policy.depositRefundableOnCustomerCancel) "Có" else "Không"}",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            // 4. Hoàn toàn bộ khi thanh toán 100%
                            Text(
                                text = "Hoàn tiền 100% khi trả đủ & hủy trước hạn: ${if (policy.fullPaymentRefundableBeforeDeadline) "Có" else "Không"}",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            // 5. Chủ sân hủy hoàn 100%
                            Text(
                                text = "Chủ sân hủy đơn: ${if (policy.ownerCancellationFullRefund) "Hoàn trả 100% tiền cho khách" else "Theo thỏa thuận"}",
                                style = MaterialTheme.typography.bodyMedium
                            )

                            Spacer(Modifier.height(6.dp))

                            // 6. Thời gian đếm ngược giữ chỗ
                            Text(
                                text = "Thời gian giữ chỗ thanh toán cọc: ${policy.paymentTimeoutMinutes} phút",
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
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.5.dp, if (isMaintenance) Color(0xFFFECDD3) else Color(0xFFA7F3D0)),
        colors = CardDefaults.cardColors(
            containerColor = if (isMaintenance)
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
            else
                Color(0xFFECFDF5)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CustomerIcon(CustomerIconKind.COURT, modifier = Modifier.size(26.dp))
                Text(
                    text = field.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                CustomerIcon(CustomerIconKind.ARROW, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.height(10.dp))
            Text(
                text = if (isMaintenance) "Sân tạm thời không nhận đặt" else "Chọn giờ trống và đặt sân",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(10.dp))
            Surface(
                color = if (isMaintenance)
                    MaterialTheme.colorScheme.errorContainer
                else
                    MaterialTheme.colorScheme.primaryContainer,
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = if (isMaintenance) "Đang bảo trì" else "Hoạt động",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Medium,
                    color = if (isMaintenance)
                        MaterialTheme.colorScheme.onErrorContainer
                    else
                        MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}
