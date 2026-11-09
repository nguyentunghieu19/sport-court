package com.court.sportcourt.ui.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.court.sportcourt.ui.auth.LoginScreen
import com.court.sportcourt.ui.auth.RegisterScreen
import com.court.sportcourt.ui.booking.BookingConfirmScreen
import com.court.sportcourt.ui.booking.BookingDetailScreen
import com.court.sportcourt.ui.booking.MyBookingsScreen
import com.court.sportcourt.ui.components.NavigationTab
import com.court.sportcourt.ui.customer.CustomerTheme
import com.court.sportcourt.ui.field.FieldAvailabilityScreen
import com.court.sportcourt.ui.home.HomeScreen
import com.court.sportcourt.ui.payment.PaymentHistoryScreen
import com.court.sportcourt.ui.payment.PaymentOptionScreen
import com.court.sportcourt.ui.payment.PaymentResultScreen
import com.court.sportcourt.ui.payment.PaymentWebViewScreen
import com.court.sportcourt.ui.profile.ProfileScreen
import com.court.sportcourt.ui.staff.StaffBookingDetailScreen
import com.court.sportcourt.ui.staff.StaffHomeScreen
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
    const val PAYMENT_OPTION = "payment_option/{bookingId}/{totalAmount}/{depositAmount}"
    const val PAYMENT_WEBVIEW = "payment_webview/{paymentId}"
    const val PAYMENT_RESULT = "payment_result/{paymentId}"
    const val PAYMENT_HISTORY = "payment_history"
    const val STAFF_HOME = "staff_home"
    const val STAFF_BOOKING_DETAIL = "staff_booking_detail/{bookingId}"
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
            isLoggedIn = session != null,
            userRole = session?.role
        )
    }
}

@Composable
private fun AppNavGraph(
    startDestination: String,
    isLoggedIn: Boolean,
    userRole: String? = null
) {
    val navController = rememberNavController()
    val currentEntry by navController.currentBackStackEntryAsState()
    val customerAppearance = userRole != "STAFF" && userRole != "OWNER" &&
        currentEntry?.destination?.route in setOf(
            Routes.HOME, Routes.VENUE_DETAIL, Routes.FIELD_AVAILABILITY,
            Routes.BOOKING_CONFIRM, Routes.BOOKING_DETAIL, Routes.MY_BOOKINGS,
            Routes.PAYMENT_OPTION, Routes.PAYMENT_RESULT, Routes.PAYMENT_HISTORY, Routes.PROFILE
        )

    val handleTabSelected: (NavigationTab) -> Unit = { tab ->
        when (tab) {
            NavigationTab.HOME -> {
                if (userRole == "STAFF" || userRole == "OWNER") {
                    navController.navigate(Routes.STAFF_HOME) {
                        popUpTo(Routes.STAFF_HOME) { inclusive = true }
                    }
                } else {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                }
            }
            NavigationTab.BOOKINGS -> {
                if (isLoggedIn) {
                    if (userRole == "STAFF" || userRole == "OWNER") {
                        navController.navigate(Routes.STAFF_HOME) {
                            popUpTo(Routes.STAFF_HOME) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Routes.MY_BOOKINGS) {
                            popUpTo(Routes.HOME) { inclusive = false }
                        }
                    }
                } else {
                    navController.navigate(Routes.LOGIN)
                }
            }
            NavigationTab.NOTIFICATIONS -> {
                navController.navigate(Routes.HOME) {
                    popUpTo(Routes.HOME) { inclusive = true }
                }
            }
            NavigationTab.PROFILE -> {
                if (isLoggedIn) {
                    navController.navigate(Routes.PROFILE) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                } else {
                    navController.navigate(Routes.LOGIN)
                }
            }
        }
    }

    CustomerTheme(enabled = customerAppearance) {
      NavHost(navController = navController, startDestination = startDestination) {

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoggedIn = {
                    if (userRole == "STAFF" || userRole == "OWNER") {
                        navController.navigate(Routes.STAFF_HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    }
                },
                onGoToRegister = { navController.navigate(Routes.REGISTER) },
                onBackToGuest = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.STAFF_HOME) {
            StaffHomeScreen(
                onLoggedOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.STAFF_HOME) { inclusive = true }
                    }
                },
                onNavigateToProfile = {
                    navController.navigate(Routes.PROFILE)
                },
                onNavigateToBookingDetail = { bookingId: Long ->
                    navController.navigate("staff_booking_detail/$bookingId")
                }
            )
        }

        composable(
            route = Routes.STAFF_BOOKING_DETAIL,
            arguments = listOf(navArgument("bookingId") { type = NavType.LongType })
        ) {
            StaffBookingDetailScreen(
                onBack = { navController.popBackStack() }
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
                        navController.navigate("booking_confirm/$fieldId/$selectedDate/$startTime/$endTime/${totalPrice.toFloat()}")
                    } else {
                        navController.navigate(Routes.LOGIN)
                    }
                },
                onOpenMyPendingBooking = { bookingId ->
                    navController.navigate("booking_detail/$bookingId")
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
                onNavigateToPaymentOption = { bookingId, totalAmount, depositAmount ->
                    navController.navigate("payment_option/$bookingId/${totalAmount.toFloat()}/${depositAmount.toFloat()}")
                }
            )
        }

        composable(
            route = Routes.PAYMENT_OPTION,
            arguments = listOf(
                navArgument("bookingId") { type = NavType.LongType },
                navArgument("totalAmount") { type = NavType.FloatType },
                navArgument("depositAmount") { type = NavType.FloatType }
            )
        ) {
            val context = LocalContext.current
            PaymentOptionScreen(
                onBack = { navController.popBackStack() },
                onOpenPaymentUrl = { paymentId, paymentUrl ->
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(paymentUrl))
                    context.startActivity(intent)

                    navController.navigate("payment_result/$paymentId") {
                        popUpTo(Routes.BOOKING_DETAIL) { inclusive = false }
                    }
                }
            )
        }

        composable(
            route = "payment_webview/{paymentId}/{encodedUrl}",
            arguments = listOf(
                navArgument("paymentId") { type = NavType.LongType },
                navArgument("encodedUrl") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val paymentId = backStackEntry.arguments?.getLong("paymentId") ?: 0L
            val encodedUrl = backStackEntry.arguments?.getString("encodedUrl") ?: ""
            val paymentUrl = try {
                String(
                    android.util.Base64.decode(encodedUrl, android.util.Base64.URL_SAFE or android.util.Base64.NO_WRAP),
                    Charsets.UTF_8
                )
            } catch (e: Exception) {
                ""
            }
            PaymentWebViewScreen(
                paymentId = paymentId,
                paymentUrl = paymentUrl,
                onBack = { navController.popBackStack() },
                onPaymentReturn = { returnedPaymentId ->
                    navController.navigate("payment_result/$returnedPaymentId") {
                        popUpTo(Routes.BOOKING_DETAIL) { inclusive = false }
                    }
                }
            )
        }

        composable(
            route = Routes.PAYMENT_RESULT,
            arguments = listOf(navArgument("paymentId") { type = NavType.LongType })
        ) {
            PaymentResultScreen(
                onNavigateToBookingDetail = { bookingId ->
                    navController.navigate("booking_detail/$bookingId") {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onNavigateToMyBookings = {
                    navController.navigate(Routes.MY_BOOKINGS) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onNavigateToHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.MY_BOOKINGS) {
            MyBookingsScreen(
                onBack = { navController.popBackStack() },
                onBookingClick = { bookingId ->
                    navController.navigate("booking_detail/$bookingId")
                },
                onNavigateToMyPayments = {
                    navController.navigate(Routes.PAYMENT_HISTORY)
                },
                onTabSelected = handleTabSelected
            )
        }

        composable(Routes.PAYMENT_HISTORY) {
            PaymentHistoryScreen(
                onBack = { navController.popBackStack() },
                onPaymentClick = { paymentId ->
                    navController.navigate("payment_result/$paymentId")
                },
                onTabSelected = handleTabSelected
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(
                onBack = {
                    navController.popBackStack()
                },
                onTabSelected = handleTabSelected
            )
        }
      }
    }
}
