package com.court.sportcourt.ui.customer

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade

private enum class VenueImageState { LOADING, SUCCESS, ERROR }

/** Displays the venue's public photo URL; callers set the image bounds/aspect ratio. */
@Composable
fun CustomerVenueImage(
    imageUrl: String?,
    venueName: String,
    modifier: Modifier = Modifier
) {
    val url = imageUrl?.trim()?.takeIf(String::isNotEmpty)
    Box(
        modifier = modifier
            .clipToBounds()
            .background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center
    ) {
        if (url == null) {
            VenueImagePlaceholder("Chưa có ảnh địa điểm")
        } else {
            // A different URL gets its own state, including when list items are reused.
            key(url) {
                var state by remember { mutableStateOf(VenueImageState.LOADING) }
                val context = LocalContext.current
                val request = remember(url, context) {
                    ImageRequest.Builder(context)
                        .data(url)
                        .crossfade(true)
                        .build()
                }
                AsyncImage(
                    model = request,
                    contentDescription = if (state == VenueImageState.SUCCESS) "Ảnh địa điểm $venueName" else null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                    onLoading = { state = VenueImageState.LOADING },
                    onSuccess = { state = VenueImageState.SUCCESS },
                    onError = { state = VenueImageState.ERROR }
                )
                when (state) {
                    VenueImageState.LOADING -> VenueImagePlaceholder("Đang tải ảnh…", loading = true)
                    VenueImageState.ERROR -> VenueImagePlaceholder("Không tải được ảnh")
                    VenueImageState.SUCCESS -> Unit
                }
            }
        }
    }
}

@Composable
private fun VenueImagePlaceholder(message: String, loading: Boolean = false) {
    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primaryContainer).padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically)
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(28.dp),
                color = MaterialTheme.colorScheme.primary,
                strokeWidth = 2.dp
            )
        } else {
            CustomerIcon(CustomerIconKind.COURT, modifier = Modifier.size(40.dp))
        }
        Text(
            text = message,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            textAlign = TextAlign.Center
        )
    }
}
