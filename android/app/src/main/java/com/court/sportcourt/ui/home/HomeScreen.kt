package com.court.sportcourt.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import com.court.sportcourt.data.remote.dto.VenueResponse
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onLoggedOut: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onNavigateToMyBookings: () -> Unit,
    onVenueClick: (Long) -> Unit = {},
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
                    if (session != null) {
                        TextButton(onClick = onNavigateToProfile) {
                            Text("Hồ sơ")
                        }
                        TextButton(onClick = { viewModel.logout(onLoggedOut) }) {
                            Text("Đăng xuất", color = MaterialTheme.colorScheme.error)
                        }
                    } else {
                        Button(onClick = onNavigateToLogin) {
                            Text("Đăng nhập")
                        }
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
                    onClick = {
                        if (session != null) {
                            onNavigateToMyBookings()
                        } else {
                            onNavigateToLogin()
                        }
                    },
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
                    onClick = {
                        if (session != null) {
                            onNavigateToProfile()
                        } else {
                            onNavigateToLogin()
                        }
                    },
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
                    sessionName = session?.fullName,
                    uiState = uiState,
                    onSearchQueryChange = viewModel::onSearchQueryChange,
                    onLoadNextPage = viewModel::loadNextPage,
                    onOpenFilter = { viewModel.toggleFilterSheet(true) },
                    onClearFilters = viewModel::clearFilters,
                    onVenueClick = { venue ->
                        viewModel.onVenueClick(venue)
                        onVenueClick(venue.id)
                    }
                )

                HomeTab.BOOKINGS -> {
                    LaunchedEffect(Unit) {
                        if (session != null) {
                            onNavigateToMyBookings()
                        } else {
                            onNavigateToLogin()
                        }
                    }
                }

                HomeTab.NOTIFICATIONS -> NotificationsContentView(
                    notifications = uiState.mockNotifications
                )

                HomeTab.PROFILE -> {
                    LaunchedEffect(Unit) {
                        if (session != null) {
                            onNavigateToProfile()
                        } else {
                            onNavigateToLogin()
                        }
                    }
                }
            }
        }

        // Màn hình 2: Bottom Sheet Bộ Lọc (Thành phố, Quận/Huyện, Môn thể thao)
        if (uiState.showFilterSheet) {
            FilterBottomSheet(
                uiState = uiState,
                onDismiss = { viewModel.toggleFilterSheet(false) },
                onApply = { city, district, sportCode ->
                    viewModel.applyFilters(city, district, sportCode)
                },
                onReset = { viewModel.clearFilters() }
            )
        }
    }
}

@Composable
private fun HomeContentView(
    sessionName: String?,
    uiState: HomeUiState,
    onSearchQueryChange: (String) -> Unit,
    onLoadNextPage: () -> Unit,
    onOpenFilter: () -> Unit,
    onClearFilters: () -> Unit,
    onVenueClick: (VenueResponse) -> Unit
) {
    val listState = rememberLazyListState()

    val shouldLoadMore by remember {
        derivedStateOf {
            val totalItems = listState.layoutInfo.totalItemsCount
            val lastVisibleItemIndex = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            totalItems > 0 && lastVisibleItemIndex >= totalItems - 2
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onLoadNextPage()
        }
    }

    LazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(Modifier.height(12.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = if (sessionName != null) "Xin chào, $sessionName! 👋" else "Xin chào quý khách! 👋",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Tìm kiếm & Đặt sân thể thao nhanh chóng",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = onSearchQueryChange,
                    label = { Text("🔍 Tìm tên địa điểm, quận...") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                )

                Button(
                    onClick = onOpenFilter,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(56.dp)
                ) {
                    Text("⚙️ Bộ lọc")
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        val hasActiveFilter = uiState.selectedSportCode != null || uiState.selectedCity != null || uiState.selectedDistrict != null
        if (hasActiveFilter) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Đang lọc:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)

                    uiState.selectedSportCode?.let { code ->
                        val label = uiState.sportTypes.find { it.code == code }?.label ?: code
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("🏆 Môn: $label", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    uiState.selectedCity?.let { city ->
                        Surface(
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("🏙️ $city", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    uiState.selectedDistrict?.let { district ->
                        Surface(
                            color = MaterialTheme.colorScheme.tertiaryContainer,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("📍 $district", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    TextButton(onClick = onClearFilters) {
                        Text("Xóa lọc", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Danh sách địa điểm sân",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Trang ${uiState.page + 1}",
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
        }

        if (uiState.isLoading && uiState.venues.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        } else if (uiState.venues.isEmpty()) {
            item {
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
                        Text("🚫 Không tìm thấy địa điểm nào", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Thử thay đổi từ khóa hoặc bộ lọc",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(
                items = uiState.venues,
                key = { it.id }
            ) { venue ->
                VenueCard(
                    venue = venue,
                    onClick = { onVenueClick(venue) }
                )
            }

            if (uiState.isLoadingMore) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.padding(8.dp))
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun FilterBottomSheet(
    uiState: HomeUiState,
    onDismiss: () -> Unit,
    onApply: (city: String?, district: String?, sportCode: String?) -> Unit,
    onReset: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var tempCity by remember { mutableStateOf(uiState.selectedCity ?: "") }
    var tempDistrict by remember { mutableStateOf(uiState.selectedDistrict ?: "") }
    var tempSportCode by remember { mutableStateOf(uiState.selectedSportCode) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "Bộ lọc địa điểm sân",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(Modifier.height(16.dp))

            Text(
                text = "Môn thể thao (Hiển thị nhãn, gửi bằng mã code)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(Modifier.height(8.dp))

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = tempSportCode == null,
                    onClick = { tempSportCode = null },
                    label = { Text("Tất cả môn") }
                )

                uiState.sportTypes.forEach { sport ->
                    FilterChip(
                        selected = tempSportCode == sport.code,
                        onClick = { tempSportCode = if (tempSportCode == sport.code) null else sport.code },
                        label = { Text(sport.label) }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = tempCity,
                onValueChange = { tempCity = it },
                label = { Text("Thành phố (ví dụ: TP.HCM, Hà Nội)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(12.dp))

            OutlinedTextField(
                value = tempDistrict,
                onValueChange = { tempDistrict = it },
                label = { Text("Quận / Huyện (ví dụ: Tân Bình, Quận 10)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        onReset()
                        onDismiss()
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Đặt lại")
                }

                Button(
                    onClick = {
                        onApply(tempCity, tempDistrict, tempSportCode)
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Áp dụng")
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun VenueCard(
    venue: VenueResponse,
    onClick: () -> Unit
) {
    val currencyFormatter = remember {
        NumberFormat.getCurrencyInstance(Locale("vi", "VN"))
    }
    val formattedPrice = remember(venue.minBasePrice) {
        currencyFormatter.format(venue.minBasePrice)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = venue.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )

                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "Quận: ${venue.district}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(6.dp))

            Text(
                text = "📍 ${venue.address}${if (!venue.city.isNullOrBlank()) ", ${venue.city}" else ""}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(Modifier.height(10.dp))

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
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                text = "🏆 $displayLabel",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Giá từ: $formattedPrice/giờ",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "Xem chi tiết →",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
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
