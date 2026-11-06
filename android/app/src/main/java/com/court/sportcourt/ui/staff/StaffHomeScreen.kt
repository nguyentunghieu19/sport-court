package com.court.sportcourt.ui.staff

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel

enum class StaffTab {
    BOOKINGS, REFUNDS, PROFILE
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
    var currentTab by remember { mutableStateOf(StaffTab.BOOKINGS) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (currentTab) {
                            StaffTab.BOOKINGS -> "Quản lý Đơn đặt sân 📋"
                            StaffTab.REFUNDS -> "Yêu cầu Hoàn tiền 💸"
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
            when (currentTab) {
                StaffTab.BOOKINGS -> StaffBookingListScreen(
                    onBookingClick = onNavigateToBookingDetail
                )
                StaffTab.REFUNDS -> StaffRefundListScreen()
                StaffTab.PROFILE -> onNavigateToProfile()
            }
        }
    }
}
