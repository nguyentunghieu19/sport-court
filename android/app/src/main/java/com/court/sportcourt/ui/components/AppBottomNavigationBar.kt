package com.court.sportcourt.ui.components

import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.court.sportcourt.ui.customer.CustomerIcon
import com.court.sportcourt.ui.customer.CustomerIconKind
import com.court.sportcourt.ui.customer.LocalCustomerAppearance

enum class NavigationTab {
    HOME, BOOKINGS, NOTIFICATIONS, PROFILE
}

@Composable
fun AppBottomNavigationBar(
    currentTab: NavigationTab,
    unreadNotificationCount: Int = 0,
    onTabSelected: (NavigationTab) -> Unit
) {
    if (LocalCustomerAppearance.current) {
        CustomerBottomNavigationBar(currentTab, unreadNotificationCount, onTabSelected)
        return
    }
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

@Composable
private fun CustomerBottomNavigationBar(
    currentTab: NavigationTab,
    unreadNotificationCount: Int,
    onTabSelected: (NavigationTab) -> Unit
) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface, tonalElevation = 0.dp) {
        NavigationTab.entries.forEach { tab ->
            val label = when (tab) {
                NavigationTab.HOME -> "Trang chủ"
                NavigationTab.BOOKINGS -> "Lịch đặt"
                NavigationTab.NOTIFICATIONS -> "Thông báo"
                NavigationTab.PROFILE -> "Cá nhân"
            }
            val icon = when (tab) {
                NavigationTab.HOME -> CustomerIconKind.HOME
                NavigationTab.BOOKINGS -> CustomerIconKind.CALENDAR
                NavigationTab.NOTIFICATIONS -> CustomerIconKind.BELL
                NavigationTab.PROFILE -> CustomerIconKind.USER
            }
            NavigationBarItem(
                selected = currentTab == tab,
                onClick = { onTabSelected(tab) },
                icon = {
                    BadgedBox(badge = {
                        if (tab == NavigationTab.NOTIFICATIONS && unreadNotificationCount > 0) {
                            Badge { Text(unreadNotificationCount.toString()) }
                        }
                    }) {
                        CustomerIcon(
                            kind = icon,
                            tint = if (currentTab == tab) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
        }
    }
}
