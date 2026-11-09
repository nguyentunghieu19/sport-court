package com.court.sportcourt.ui.field

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.navigationBarsPadding
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
import androidx.compose.material3.IconButton
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import com.court.sportcourt.data.remote.dto.TimeSlotDto
import com.court.sportcourt.ui.customer.CustomerIcon
import com.court.sportcourt.ui.customer.CustomerIconKind
import com.court.sportcourt.ui.customer.CustomerSectionLabel
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FieldAvailabilityScreen(
    onBack: () -> Unit,
    onBookClick: (fieldId: Long, selectedDate: String, startTime: String, endTime: String, totalPrice: Double) -> Unit,
    onOpenMyPendingBooking: (bookingId: Long) -> Unit = {},
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
                title = { Text("Chọn giờ chơi", fontWeight = FontWeight.Bold) },
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
        bottomBar = {
            if (state.isBookable && state.selectedSlotIndexes.isNotEmpty()) {
                val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
                val formattedTotal = currencyFormatter.format(state.totalSelectedPrice)

                Surface(
                    shadowElevation = 3.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${state.selectedSlotIndexes.size} khung giờ đã chọn",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = formattedTotal,
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
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)
                        ) {
                            Text("Đặt sân ngay", fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(8.dp))
                            CustomerIcon(CustomerIconKind.ARROW, tint = MaterialTheme.colorScheme.onPrimary)
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
            CustomerSectionLabel("Ngày chơi")
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
                        shape = RoundedCornerShape(12.dp),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        ),
                        modifier = Modifier.heightIn(min = 60.dp),
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
                            text = "Sân hiện không nhận đặt lịch online",
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
                    text = "Giờ chơi · ${slots.count { it.status == "AVAILABLE" }} khung còn trống",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Chọn một hoặc nhiều khung giờ liên tiếp",
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
                                onClick = {
                                    viewModel.toggleTimeSlot(index, onOpenMyPendingBooking)
                                }
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
    val isMyPending = slot.status == "PENDING_PAYMENT" && slot.myPendingBookingId != null
    val isClickable = isAvailable || isMyPending
    val isPending = slot.status == "PENDING" || slot.status == "PENDING_PAYMENT" || slot.status == "HOLD"
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val formattedPrice = remember(slot.price) { currencyFormatter.format(slot.price) }

    val backgroundColor = when {
        isSelected -> MaterialTheme.colorScheme.primaryContainer
        isAvailable -> MaterialTheme.colorScheme.surface
        isPending -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f)
        slot.status == "BOOKED" || slot.status == "CONFIRMED" -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        else -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
    }

    val animatedBackground by animateColorAsState(
        targetValue = backgroundColor,
        animationSpec = tween(160),
        label = "slotSelection"
    )

    val border = if (isSelected || isMyPending) {
        BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
    } else {
        BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isClickable, onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = animatedBackground),
        border = border
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${slot.startTime} - ${slot.endTime}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isClickable) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = formattedPrice,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = if (isClickable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(6.dp))

            Surface(
                color = when {
                    isAvailable -> if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer
                    isPending -> MaterialTheme.colorScheme.tertiaryContainer
                    slot.status == "BOOKED" || slot.status == "CONFIRMED" -> MaterialTheme.colorScheme.outlineVariant
                    else -> MaterialTheme.colorScheme.error
                },
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = when {
                        isAvailable -> if (isSelected) "Đã chọn" else "Còn trống"
                        isMyPending -> "Của bạn · Xem đơn"
                        isPending -> "Đang xử lý"
                        slot.status == "BOOKED" || slot.status == "CONFIRMED" -> "Đã đặt"
                        else -> "Bảo trì"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        isSelected -> MaterialTheme.colorScheme.onPrimary
                        isAvailable -> MaterialTheme.colorScheme.onSecondaryContainer
                        isPending -> MaterialTheme.colorScheme.onTertiaryContainer
                        slot.status == "BOOKED" || slot.status == "CONFIRMED" -> MaterialTheme.colorScheme.onSurfaceVariant
                        else -> MaterialTheme.colorScheme.onError
                    },
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}
