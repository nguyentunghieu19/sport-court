package com.court.sportcourt.ui.staff

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel

enum class StaffTab {
    BOOKINGS, REFUNDS, STATS, PROFILE
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffHomeScreen(
    onLoggedOut: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToBookingDetail: (bookingId: Long) -> Unit,
    viewModel: StaffHomeViewModel = hiltViewModel()
) {
    val session by viewModel.session.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    var currentTab by remember { mutableStateOf(StaffTab.BOOKINGS) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (currentTab) {
                            StaffTab.BOOKINGS -> "Quản lý Đơn đặt sân 📋"
                            StaffTab.REFUNDS -> "Yêu cầu Hoàn tiền 💸"
                            StaffTab.STATS -> "Báo cáo Thống kê 📊"
                            StaffTab.PROFILE -> "Cá nhân Staff 👤"
                        },
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                actions = {
                    if (session != null) {
                        TextButton(onClick = { viewModel.logout(onLoggedOut) }) {
                            Text("Đăng xuất", color = MaterialTheme.colorScheme.error)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentTab == StaffTab.BOOKINGS,
                    onClick = { currentTab = StaffTab.BOOKINGS },
                    icon = { Text("📋", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Đơn đặt", fontWeight = FontWeight.Bold) }
                )

                NavigationBarItem(
                    selected = currentTab == StaffTab.REFUNDS,
                    onClick = { currentTab = StaffTab.REFUNDS },
                    icon = { Text("💸", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Hoàn tiền", fontWeight = FontWeight.Bold) }
                )

                NavigationBarItem(
                    selected = currentTab == StaffTab.STATS,
                    onClick = { currentTab = StaffTab.STATS },
                    icon = { Text("📊", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Thống kê", fontWeight = FontWeight.Bold) }
                )

                NavigationBarItem(
                    selected = currentTab == StaffTab.PROFILE,
                    onClick = { onNavigateToProfile() },
                    icon = { Text("👤", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Cá nhân", fontWeight = FontWeight.Bold) }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Thanh Chọn Địa Điểm Phân Công
            if (currentTab != StaffTab.PROFILE) {
                if (uiState.isEmptyAssigned) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f)
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "⚠️ Bạn chưa được phân công địa điểm nào.",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.error
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "Vui lòng liên hệ Chủ sân để được gán quyền quản lý địa điểm.",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                } else if (uiState.assignedVenues.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Địa điểm:",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold
                        )

                        uiState.assignedVenues.forEach { venue ->
                            val isSelected = venue.id == uiState.selectedVenueId
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.selectVenue(venue.id) },
                                label = { Text("🏟️ ${venue.name}") },
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }
                }
            }

            when (currentTab) {
                StaffTab.BOOKINGS -> StaffBookingListScreen(
                    venueId = uiState.selectedVenueId,
                    onBookingClick = onNavigateToBookingDetail
                )
                StaffTab.REFUNDS -> StaffRefundListScreen(
                    venueId = uiState.selectedVenueId
                )
                StaffTab.STATS -> StaffStatsScreen(
                    venueId = uiState.selectedVenueId
                )
                StaffTab.PROFILE -> onNavigateToProfile()
            }
        }
    }
}
