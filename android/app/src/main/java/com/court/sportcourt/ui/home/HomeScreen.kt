package com.court.sportcourt.ui.home

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onLoggedOut: () -> Unit,
    onNavigateToProfile: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val session by viewModel.session.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbarMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (uiState.currentTab) {
                            HomeTab.HOME -> "SportCourt ⚽"
                            HomeTab.BOOKINGS -> "Lịch đặt sân 📅"
                            HomeTab.NOTIFICATIONS -> "Thông báo 🔔"
                            HomeTab.PROFILE -> "Cá nhân 👤"
                        },
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                actions = {
                    TextButton(onClick = { viewModel.logout(onLoggedOut) }) {
                        Text("Đăng xuất", color = MaterialTheme.colorScheme.error)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        },
        bottomBar = {
            val unreadCount = uiState.mockNotifications.count { it.isUnread }
            NavigationBar {
                NavigationBarItem(
                    selected = uiState.currentTab == HomeTab.HOME,
                    onClick = { viewModel.selectTab(HomeTab.HOME) },
                    icon = { Text("🏠", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Trang chủ", fontWeight = FontWeight.Bold) }
                )

                NavigationBarItem(
                    selected = uiState.currentTab == HomeTab.BOOKINGS,
                    onClick = { viewModel.selectTab(HomeTab.BOOKINGS) },
                    icon = { Text("📅", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Lịch đặt", fontWeight = FontWeight.Bold) }
                )

                NavigationBarItem(
                    selected = uiState.currentTab == HomeTab.NOTIFICATIONS,
                    onClick = { viewModel.selectTab(HomeTab.NOTIFICATIONS) },
                    icon = {
                        if (unreadCount > 0) {
                            BadgedBox(
                                badge = { Badge { Text("$unreadCount") } }
                            ) {
                                Text("🔔", style = MaterialTheme.typography.titleMedium)
                            }
                        } else {
                            Text("🔔", style = MaterialTheme.typography.titleMedium)
                        }
                    },
                    label = {
                        Text(
                            text = if (unreadCount > 0) "Thông báo($unreadCount)" else "Thông báo",
                            fontWeight = FontWeight.Bold
                        )
                    }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToProfile,
                    icon = { Text("👤", style = MaterialTheme.typography.titleMedium) },
                    label = { Text("Cá nhân", fontWeight = FontWeight.Bold) }
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (uiState.currentTab) {
                HomeTab.HOME -> HomeContentView(
                    sessionName = session?.fullName ?: "người dùng",
                    sessionRole = session?.role ?: "Khách",
                    uiState = uiState,
                    onSearchQueryChange = viewModel::onSearchQueryChange,
                    onSelectCategory = viewModel::selectCategory,
                    onBookCourtClick = viewModel::onBookCourtClick
                )

                HomeTab.BOOKINGS -> BookingsContentView(
                    bookings = uiState.mockBookings
                )

                HomeTab.NOTIFICATIONS -> NotificationsContentView(
                    notifications = uiState.mockNotifications
                )

                HomeTab.PROFILE -> {
                    // Navigate to profile
                    LaunchedEffect(Unit) {
                        onNavigateToProfile()
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeContentView(
    sessionName: String,
    sessionRole: String,
    uiState: HomeUiState,
    onSearchQueryChange: (String) -> Unit,
    onSelectCategory: (String) -> Unit,
    onBookCourtClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Welcome Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Xin chào, $sessionName! 👋",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Vai trò: $sessionRole • Tìm & đặt sân thể thao nhanh chóng",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // Search Bar
        OutlinedTextField(
            value = uiState.searchQuery,
            onValueChange = onSearchQueryChange,
            label = { Text("🔍 Tìm tên sân, môn thể thao, địa chỉ...") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(Modifier.height(16.dp))

        // Sport Categories
        Text(
            text = "Danh mục môn thể thao",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(Modifier.height(8.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            uiState.categories.forEach { category ->
                val selected = category.id == uiState.selectedCategoryId
                FilterChip(
                    selected = selected,
                    onClick = { onSelectCategory(category.id) },
                    label = { Text("${category.iconEmoji} ${category.name}") }
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // Featured Courts Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Sân thể thao nổi bật",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "${uiState.filteredCourts.size} sân",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // List of Courts
        if (uiState.filteredCourts.isEmpty()) {
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
                    Text("🚫 Không tìm thấy sân phù hợp", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Thử chọn danh mục khác hoặc thay đổi từ khóa tìm kiếm",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            uiState.filteredCourts.forEach { court ->
                CourtCard(
                    court = court,
                    onBookClick = { onBookCourtClick(court.name) }
                )
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun CourtCard(
    court: SportCourtItem,
    onBookClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = court.categoryName,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                Text(
                    text = if (court.isAvailable) "🟢 Còn sân trống" else "🔴 Hết sân",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (court.isAvailable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                )
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = court.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = "📍 ${court.address}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "⭐ ${court.rating} (${court.reviewCount} đánh giá)",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = court.pricePerHour,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Button(
                    onClick = onBookClick,
                    enabled = court.isAvailable,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Đặt sân ngay")
                }
            }
        }
    }
}

@Composable
private fun BookingsContentView(bookings: List<BookingItem>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "Lịch đặt sân của bạn 📅",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(12.dp))

        if (bookings.isEmpty()) {
            Text("Bạn chưa có lịch đặt sân nào.")
        } else {
            bookings.forEach { booking ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = booking.courtName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = booking.status,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "⏱️ ${booking.date} (${booking.timeSlot})",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "💰 Tổng tiền: ${booking.price}",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationsContentView(notifications: List<NotificationItem>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "Thông báo 🔔",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(12.dp))

        if (notifications.isEmpty()) {
            Text("Bạn không có thông báo nào.")
        } else {
            notifications.forEach { notif ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (notif.isUnread)
                            MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
                        else
                            MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = notif.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = notif.time,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = notif.message,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}
