package com.court.backend.service;

import com.court.backend.dto.response.*;
import com.court.backend.entity.*;
import com.court.backend.enums.*;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notifications;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(Long user, boolean unreadOnly, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var result = unreadOnly ? notifications.findByUserIdAndStatus(user, NotificationStatus.UNREAD, pageable)
                : notifications.findByUserId(user, pageable);
        return PageResponse.from(result.map(NotificationResponse::from));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long user) {
        return notifications.countByUserIdAndStatus(user, NotificationStatus.UNREAD);
    }

    @Transactional
    public void read(Long user, Long id) {
        if (!notifications.existsByIdAndUserId(id, user))
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo");
        notifications.markRead(user, id, NotificationStatus.READ, NotificationStatus.UNREAD, Instant.now());
    }

    @Transactional
    public void readAll(Long user) {
        notifications.markRead(user, null, NotificationStatus.READ, NotificationStatus.UNREAD, Instant.now());
    }

    @Transactional
    public void send(User recipient, Booking booking, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setBooking(booking);
        notification.setTitle(title);
        notification.setMessage(message);
        notifications.save(notification);
    }

    @Transactional
    public void notifyAdmins(String title, String message) {
        for (User admin : users.findByRoleAndActiveTrueAndDeletedAtIsNull(UserRole.ADMIN))
            send(admin, null, title, message);
    }
}
