package com.court.sportcourt.ui.customer

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class CustomerIconKind {
    HOME, CALENDAR, BELL, USER, SEARCH, FILTER, BACK, ARROW, LOCATION, CLOCK, COURT, WALLET, CHECK
}

/** Small, decorative line icons. The containing control supplies the accessible label. */
@Composable
fun CustomerIcon(
    kind: CustomerIconKind,
    modifier: Modifier = Modifier,
    tint: Color = MaterialTheme.colorScheme.primary
) {
    Canvas(modifier.size(24.dp)) {
        scale(size.width / 24f, size.height / 24f, pivot = Offset.Zero) {
            val stroke = Stroke(width = 1.7f, cap = StrokeCap.Round)
            fun line(x1: Float, y1: Float, x2: Float, y2: Float) =
                drawLine(tint, Offset(x1, y1), Offset(x2, y2), strokeWidth = 1.7f, cap = StrokeCap.Round)
            when (kind) {
                CustomerIconKind.HOME -> {
                    val roof = Path().apply {
                        moveTo(3f, 10f); lineTo(12f, 3f); lineTo(21f, 10f)
                        moveTo(5f, 9f); lineTo(5f, 21f); lineTo(19f, 21f); lineTo(19f, 9f)
                        moveTo(9f, 21f); lineTo(9f, 14f); lineTo(15f, 14f); lineTo(15f, 21f)
                    }
                    drawPath(roof, tint, style = stroke)
                }
                CustomerIconKind.CALENDAR -> {
                    drawRoundRect(tint, Offset(3f, 5f), Size(18f, 16f), CornerRadius(2f), style = stroke)
                    line(3f, 10f, 21f, 10f); line(8f, 3f, 8f, 7f); line(16f, 3f, 16f, 7f)
                    line(7f, 14f, 10f, 14f); line(14f, 14f, 17f, 14f)
                }
                CustomerIconKind.BELL -> {
                    val bell = Path().apply {
                        moveTo(4f, 18f); lineTo(6f, 15f); lineTo(6f, 10f)
                        cubicTo(6f, 2f, 18f, 2f, 18f, 10f)
                        lineTo(18f, 15f); lineTo(20f, 18f); close()
                    }
                    drawPath(bell, tint, style = stroke)
                    drawArc(tint, 0f, 180f, false, Offset(9f, 19f), Size(6f, 3f), style = stroke)
                }
                CustomerIconKind.USER -> {
                    drawCircle(tint, 3.5f, Offset(12f, 7f), style = stroke)
                    drawArc(tint, 180f, 180f, false, Offset(4f, 13f), Size(16f, 14f), style = stroke)
                }
                CustomerIconKind.SEARCH -> {
                    drawCircle(tint, 6.5f, Offset(10f, 10f), style = stroke)
                    line(15f, 15f, 21f, 21f)
                }
                CustomerIconKind.FILTER -> {
                    line(3f, 7f, 21f, 7f); line(3f, 17f, 21f, 17f)
                    drawCircle(tint, 2.5f, Offset(8f, 7f), style = stroke)
                    drawCircle(tint, 2.5f, Offset(16f, 17f), style = stroke)
                }
                CustomerIconKind.BACK -> {
                    line(20f, 12f, 4f, 12f); line(4f, 12f, 10f, 6f); line(4f, 12f, 10f, 18f)
                }
                CustomerIconKind.ARROW -> {
                    line(4f, 12f, 20f, 12f); line(20f, 12f, 14f, 6f); line(20f, 12f, 14f, 18f)
                }
                CustomerIconKind.LOCATION -> {
                    val pin = Path().apply {
                        moveTo(12f, 22f)
                        cubicTo(9f, 18f, 4f, 13f, 4f, 9f)
                        cubicTo(4f, -1f, 20f, -1f, 20f, 9f)
                        cubicTo(20f, 13f, 15f, 18f, 12f, 22f)
                    }
                    drawPath(pin, tint, style = stroke)
                    drawCircle(tint, 2.5f, Offset(12f, 9f), style = stroke)
                }
                CustomerIconKind.CLOCK -> {
                    drawCircle(tint, 9f, Offset(12f, 12f), style = stroke)
                    line(12f, 6f, 12f, 12f); line(12f, 12f, 16f, 14f)
                }
                CustomerIconKind.COURT -> {
                    drawRoundRect(tint, Offset(2f, 5f), Size(20f, 14f), CornerRadius(2f), style = stroke)
                    line(12f, 5f, 12f, 19f)
                    drawCircle(tint, 3f, Offset(12f, 12f), style = stroke)
                    drawRect(tint, Offset(2f, 9f), Size(4f, 6f), style = stroke)
                    drawRect(tint, Offset(18f, 9f), Size(4f, 6f), style = stroke)
                }
                CustomerIconKind.WALLET -> {
                    drawRoundRect(tint, Offset(3f, 5f), Size(18f, 15f), CornerRadius(2f), style = stroke)
                    drawRoundRect(tint, Offset(14f, 10f), Size(7f, 6f), CornerRadius(1f), style = stroke)
                    drawCircle(tint, 1f, Offset(17f, 13f))
                }
                CustomerIconKind.CHECK -> {
                    line(4f, 12f, 9f, 17f); line(9f, 17f, 20f, 6f)
                }
            }
        }
    }
}

/** Court markings used as brand decoration while venues have no photographs. */
@Composable
fun CourtArtwork(
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.primary
) {
    Canvas(modifier) {
        val inset = 12.dp.toPx()
        val width = (size.width - inset * 2).coerceAtLeast(0f)
        val height = (size.height - inset * 2).coerceAtLeast(0f)
        val stroke = Stroke(1.5.dp.toPx())
        drawRoundRect(color.copy(alpha = 0.45f), Offset(inset, inset), Size(width, height), CornerRadius(4.dp.toPx()), style = stroke)
        drawLine(color.copy(alpha = 0.5f), Offset(size.width / 2, inset), Offset(size.width / 2, size.height - inset), stroke.width)
        drawRect(color.copy(alpha = 0.28f), Offset(inset + width * 0.13f, inset), Size(width * 0.74f, height), style = stroke)
        drawLine(color.copy(alpha = 0.28f), Offset(inset, size.height / 2), Offset(size.width - inset, size.height / 2), stroke.width)
        drawCircle(color.copy(alpha = 0.32f), height * 0.2f, center, style = stroke)
    }
}

@Composable
fun CustomerSectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        modifier = modifier,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.onSurface
    )
}
