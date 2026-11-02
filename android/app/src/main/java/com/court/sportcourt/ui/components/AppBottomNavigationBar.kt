package com.court.sportcourt.ui.components

import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight

enum class NavigationTab {
    HOME, BOOKINGS, NOTIFICATIONS, PROFILE
}

@Composable
fun AppBottomNavigationBar(
    currentTab: NavigationTab,
    unreadNotificationCount: Int = 0,
    onTabSelected: (NavigationTab) -> Unit
) {
    NavigationBar {
        NavigationBarItem(
            selected = currentTab == NavigationTab.HOME,
            onClick = { onTabSelected(NavigationTab.HOME) },
            icon = { Text("🏠", style = MaterialTheme.typography.titleMedium) },
            label = { Text("Trang chủ", fontWeight = FontWeight.Bold) }
        )

        NavigationBarItem(
            selected = currentTab == NavigationTab.BOOKINGS,
            onClick = { onTabSelected(NavigationTab.BOOKINGS) },
            icon = { Text("📅", style = MaterialTheme.typography.titleMedium) },
            label = { Text("Lịch đặt", fontWeight = FontWeight.Bold) }
        )

        NavigationBarItem(
            selected = currentTab == NavigationTab.NOTIFICATIONS,
            onClick = { onTabSelected(NavigationTab.NOTIFICATIONS) },
            icon = {
                if (unreadNotificationCount > 0) {
                    BadgedBox(
                        badge = { Badge { Text("$unreadNotificationCount") } }
                    ) {
                        Text("🔔", style = MaterialTheme.typography.titleMedium)
                    }
                } else {
                    Text("🔔", style = MaterialTheme.typography.titleMedium)
                }
            },
            label = {
                Text(
                    text = if (unreadNotificationCount > 0) "Thông báo($unreadNotificationCount)" else "Thông báo",
                    fontWeight = FontWeight.Bold
                )
            }
        )

        NavigationBarItem(
            selected = currentTab == NavigationTab.PROFILE,
            onClick = { onTabSelected(NavigationTab.PROFILE) },
            icon = { Text("👤", style = MaterialTheme.typography.titleMedium) },
            label = { Text("Cá nhân", fontWeight = FontWeight.Bold) }
        )
    }
}
