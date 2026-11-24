package com.court.backend.dto.response;

import com.court.backend.entity.Notification;
import java.time.Instant;

public record NotificationResponse(Long id, String title, String message, String status,
                                   Long bookingId, Instant createdAt, Instant readAt) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.getStatus().name(),
                n.getBooking() == null ? null : n.getBooking().getId(), n.getCreatedAt(), n.getReadAt());
    }
}
