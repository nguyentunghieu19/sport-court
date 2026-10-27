package com.court.sportcourt.ui.field

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.court.sportcourt.data.remote.dto.TimeSlotDto
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FieldAvailabilityScreen(
    onBack: () -> Unit,
    onBookClick: (fieldId: Long, selectedDate: String, startTime: String, endTime: String, totalPrice: Double) -> Unit,
    viewModel: FieldAvailabilityViewModel = hiltViewModel()
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
                title = { Text("Lưới giờ trống sân", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("← Quay lại")
                    }
                }
            )
        },
        bottomBar = {
            if (state.isBookable && state.selectedSlotIndexes.isNotEmpty()) {
                val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
                val formattedTotal = currencyFormatter.format(state.totalSelectedPrice)

                Surface(
                    shadowElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "${state.selectedSlotIndexes.size} khung giờ đã chọn",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "Tổng tiền: $formattedTotal",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Button(
                            onClick = {
                                onBookClick(
                                    viewModel.fieldId,
                                    state.selectedDate,
                                    viewModel.selectedStartTime,
                                    viewModel.selectedEndTime,
                                    state.totalSelectedPrice
                                )
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Đặt sân ngay")
                        }
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
                .padding(16.dp)
        ) {
            Text(
                text = "Chọn ngày chơi:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                state.dateOptions.forEach { option ->
                    val selected = option.dateString == state.selectedDate
                    FilterChip(
                        selected = selected,
                        onClick = { viewModel.selectDate(option.dateString) },
                        label = {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(option.displayDay, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
                                Text(option.displayDate, style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            if (!state.isBookable) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f)
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "⚠️ Sân này hiện không nhận đặt lịch online",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Vui lòng chọn sân khác hoặc liên hệ trực tiếp với quản lý địa điểm.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            } else if (state.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                val slots = state.availabilityResponse?.timeSlots ?: emptyList()

                Text(
                    text = "Lưới khung giờ (${slots.count { it.status == "AVAILABLE" }} ô còn trống)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Chỉ cho chọn ô giờ trống (cho phép chọn nhiều giờ liền nhau)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(Modifier.height(12.dp))

                if (slots.isEmpty()) {
                    Text("Không có dữ liệu khung giờ cho ngày đã chọn.")
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        itemsIndexed(slots) { index, slot ->
                            val isSelected = state.selectedSlotIndexes.contains(index)
                            TimeSlotCard(
                                slot = slot,
                                isSelected = isSelected,
                                onClick = { viewModel.toggleTimeSlot(index) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TimeSlotCard(
    slot: TimeSlotDto,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val isAvailable = slot.status == "AVAILABLE"
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val formattedPrice = remember(slot.price) { currencyFormatter.format(slot.price) }

    val backgroundColor = when {
        isSelected -> MaterialTheme.colorScheme.primaryContainer
        isAvailable -> MaterialTheme.colorScheme.surface
        slot.status == "BOOKED" -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        else -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
    }

    val border = if (isSelected) {
        BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
    } else {
        BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isAvailable, onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        border = border
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${slot.startTime} - ${slot.endTime}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isAvailable) MaterialTheme.colorScheme.onSurface else Color.Gray
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = formattedPrice,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = if (isAvailable) MaterialTheme.colorScheme.primary else Color.Gray
            )

            Spacer(Modifier.height(6.dp))

            Surface(
                color = when (slot.status) {
                    "AVAILABLE" -> if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer
                    "BOOKED" -> MaterialTheme.colorScheme.outlineVariant
                    else -> MaterialTheme.colorScheme.error
                },
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = when (slot.status) {
                        "AVAILABLE" -> if (isSelected) "✓ Đã chọn" else "🟢 Giờ trống"
                        "BOOKED" -> "🔒 Đã đặt"
                        else -> "🔴 Bảo trì"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = when {
                        isSelected -> MaterialTheme.colorScheme.onPrimary
                        slot.status == "AVAILABLE" -> MaterialTheme.colorScheme.onSecondaryContainer
                        slot.status == "BOOKED" -> Color.DarkGray
                        else -> MaterialTheme.colorScheme.onError
                    },
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}
