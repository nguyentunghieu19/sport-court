package com.court.backend.repository;

import com.court.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import com.court.backend.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable page);
    Page<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status, Pageable page);
    long countByUserIdAndStatus(Long userId, NotificationStatus status);
    boolean existsByIdAndUserId(Long id, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.status = :read, n.readAt = :now where n.user.id = :user and n.status = :unread and (:id is null or n.id = :id)")
    int markRead(@Param("user") Long user, @Param("id") Long id,
                 @Param("read") NotificationStatus read, @Param("unread") NotificationStatus unread,
                 @Param("now") Instant now);
}
