package com.court.sportcourt.ui.customer

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

val LocalCustomerAppearance = staticCompositionLocalOf { false }

private val CustomerLightColors = lightColorScheme(
    primary = Color(0xFF08734D),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE3F3EA),
    onPrimaryContainer = Color(0xFF154C36),
    secondary = Color(0xFF4A6356),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEDF3EE),
    onSecondaryContainer = Color(0xFF304C3C),
    tertiary = Color(0xFF80611C),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFF0CC),
    onTertiaryContainer = Color(0xFF624A13),
    background = Color(0xFFF5F7F5),
    onBackground = Color(0xFF192B22),
    surface = Color.White,
    onSurface = Color(0xFF192B22),
    surfaceVariant = Color(0xFFEDF2EE),
    onSurfaceVariant = Color(0xFF58685F),
    surfaceContainer = Color(0xFFF0F4F0),
    surfaceContainerLow = Color(0xFFF8FAF8),
    surfaceContainerHigh = Color(0xFFE9F0EA),
    surfaceContainerHighest = Color(0xFFE2EAE4),
    outline = Color(0xFF77867C),
    outlineVariant = Color(0xFFDCE5DE)
)

private val CustomerDarkColors = darkColorScheme(
    primary = Color(0xFF86D7AF),
    onPrimary = Color(0xFF073923),
    primaryContainer = Color(0xFF204C37),
    onPrimaryContainer = Color(0xFFBDEFD4),
    secondary = Color(0xFFB0CDBA),
    onSecondary = Color(0xFF1B3628),
    secondaryContainer = Color(0xFF2C4034),
    onSecondaryContainer = Color(0xFFD7EBDD),
    tertiary = Color(0xFFE4C57C),
    onTertiary = Color(0xFF402E04),
    tertiaryContainer = Color(0xFF534220),
    onTertiaryContainer = Color(0xFFFFE6A7),
    background = Color(0xFF121C17),
    onBackground = Color(0xFFE2ECE5),
    surface = Color(0xFF19251E),
    onSurface = Color(0xFFE2ECE5),
    surfaceVariant = Color(0xFF293A30),
    onSurfaceVariant = Color(0xFFBDCEC2),
    surfaceContainer = Color(0xFF1E2C23),
    surfaceContainerLow = Color(0xFF19251E),
    surfaceContainerHigh = Color(0xFF27382D),
    surfaceContainerHighest = Color(0xFF304337),
    outline = Color(0xFF899F90),
    outlineVariant = Color(0xFF3E5346)
)

@Composable
fun CustomerTheme(enabled: Boolean = true, content: @Composable () -> Unit) {
    val typography = MaterialTheme.typography
    val darkTheme = isSystemInDarkTheme()
    val colors = if (darkTheme) CustomerDarkColors else CustomerLightColors
    val view = LocalView.current
    val window = (view.context as? Activity)?.window
    DisposableEffect(enabled, view, window) {
        if (enabled && !view.isInEditMode && window != null) {
            val controller = WindowCompat.getInsetsController(window, view)
            val statusWasLight = controller.isAppearanceLightStatusBars
            val navigationWasLight = controller.isAppearanceLightNavigationBars
            onDispose {
                controller.isAppearanceLightStatusBars = statusWasLight
                controller.isAppearanceLightNavigationBars = navigationWasLight
            }
        } else {
            onDispose {}
        }
    }
    SideEffect {
        if (enabled && !view.isInEditMode && window != null) {
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }
    CompositionLocalProvider(LocalCustomerAppearance provides enabled) {
        MaterialTheme(
            colorScheme = if (enabled) colors else MaterialTheme.colorScheme,
            typography = if (enabled) typography.copy(
                headlineLarge = typography.headlineLarge.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.8).sp),
                headlineSmall = typography.headlineSmall.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.4).sp),
                titleLarge = typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                titleMedium = typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                bodyLarge = typography.bodyLarge.copy(letterSpacing = 0.sp),
                labelLarge = typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
            ) else typography,
            shapes = if (enabled) Shapes(
                extraSmall = RoundedCornerShape(6.dp),
                small = RoundedCornerShape(10.dp),
                medium = RoundedCornerShape(16.dp),
                large = RoundedCornerShape(20.dp),
                extraLarge = RoundedCornerShape(24.dp)
            ) else MaterialTheme.shapes,
            content = content
        )
    }
}
