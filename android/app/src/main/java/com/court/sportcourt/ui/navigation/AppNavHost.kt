package com.court.sportcourt.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.court.sportcourt.ui.auth.LoginScreen
import com.court.sportcourt.ui.auth.RegisterScreen
import com.court.sportcourt.ui.booking.BookingConfirmScreen
import com.court.sportcourt.ui.booking.BookingDetailScreen
import com.court.sportcourt.ui.booking.MyBookingsScreen
import com.court.sportcourt.ui.field.FieldAvailabilityScreen
import com.court.sportcourt.ui.home.HomeScreen
import com.court.sportcourt.ui.profile.ProfileScreen
import com.court.sportcourt.ui.venue.VenueDetailScreen

object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val PROFILE = "profile"
    const val VENUE_DETAIL = "venue_detail/{venueId}"
    const val FIELD_AVAILABILITY = "field_availability/{fieldId}"
    const val BOOKING_CONFIRM = "booking_confirm/{fieldId}/{date}/{startTime}/{endTime}/{totalAmount}"
    const val BOOKING_DETAIL = "booking_detail/{bookingId}"
    const val MY_BOOKINGS = "my_bookings"
}

@Composable
fun AppNavHost(appViewModel: AppViewModel = hiltViewModel()) {
    val startDestination by appViewModel.startDestination.collectAsState()
    val session by appViewModel.session.collectAsState()

    if (startDestination == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else {
        AppNavGraph(
            startDestination = startDestination!!,
            isLoggedIn = session != null
        )
    }
}

@Composable
private fun AppNavGraph(
    startDestination: String,
    isLoggedIn: Boolean
) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoggedIn = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onGoToRegister = { navController.navigate(Routes.REGISTER) }
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                onRegistered = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.HOME) {
            HomeScreen(
                onLoggedOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
                onNavigateToProfile = {
                    navController.navigate(Routes.PROFILE)
                },
                onNavigateToLogin = {
                    navController.navigate(Routes.LOGIN)
                },
                onNavigateToMyBookings = {
                    navController.navigate(Routes.MY_BOOKINGS)
                },
                onVenueClick = { venueId ->
                    navController.navigate("venue_detail/$venueId")
                }
            )
        }

        composable(
            route = Routes.VENUE_DETAIL,
            arguments = listOf(navArgument("venueId") { type = NavType.LongType })
        ) {
            VenueDetailScreen(
                onBack = { navController.popBackStack() },
                onFieldClick = { fieldId ->
                    navController.navigate("field_availability/$fieldId")
                }
            )
        }

        composable(
            route = Routes.FIELD_AVAILABILITY,
            arguments = listOf(navArgument("fieldId") { type = NavType.LongType })
        ) {
            FieldAvailabilityScreen(
                onBack = { navController.popBackStack() },
                onBookClick = { fieldId, selectedDate, startTime, endTime, totalPrice ->
                    if (isLoggedIn) {
                        // Đã đăng nhập -> Mở màn hình Xác nhận đặt sân với đúng startTime, endTime và totalPrice được chọn
                        navController.navigate("booking_confirm/$fieldId/$selectedDate/$startTime/$endTime/${totalPrice.toFloat()}")
                    } else {
                        // Chưa đăng nhập (Chế độ Khách) -> Chuyển sang màn hình Đăng nhập
                        navController.navigate(Routes.LOGIN)
                    }
                }
            )
        }

        composable(
            route = Routes.BOOKING_CONFIRM,
            arguments = listOf(
                navArgument("fieldId") { type = NavType.LongType },
                navArgument("date") { type = NavType.StringType },
                navArgument("startTime") { type = NavType.StringType },
                navArgument("endTime") { type = NavType.StringType },
                navArgument("totalAmount") { type = NavType.FloatType }
            )
        ) {
            BookingConfirmScreen(
                onBack = { navController.popBackStack() },
                onBookingCreated = { createdBooking ->
                    // Mở Màn hình Chi tiết đơn vừa tạo với Đồng hồ đếm ngược 15 phút
                    navController.navigate("booking_detail/${createdBooking.id}") {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                }
            )
        }

        composable(
            route = Routes.BOOKING_DETAIL,
            arguments = listOf(navArgument("bookingId") { type = NavType.LongType })
        ) {
            BookingDetailScreen(
                onBack = { navController.popBackStack() },
                onNavigateToHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
                onNavigateToMyBookings = {
                    navController.navigate(Routes.MY_BOOKINGS) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                }
            )
        }

        composable(Routes.MY_BOOKINGS) {
            MyBookingsScreen(
                onBack = { navController.popBackStack() },
                onBookingClick = { bookingId ->
                    navController.navigate("booking_detail/$bookingId")
                }
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
