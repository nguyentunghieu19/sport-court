package com.court.backend.service;

import com.court.backend.entity.*;
import com.court.backend.enums.*;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class NotificationServiceTest {
    NotificationRepository repository = mock(NotificationRepository.class);
    UserRepository users = mock(UserRepository.class);
    NotificationService service = new NotificationService(repository, users);

    @Test void cannotReadAnotherAccountsNotification() {
        when(repository.existsByIdAndUserId(7L, 2L)).thenReturn(false);
        assertThatThrownBy(() -> service.read(2L, 7L)).isInstanceOf(ApiException.class);
        verify(repository, never()).markRead(any(), any(), any(), any(), any());
    }

    @Test void readAllIsScopedToCurrentAccountAndUnreadStatus() {
        service.readAll(2L);
        verify(repository).markRead(eq(2L), isNull(), eq(NotificationStatus.READ), eq(NotificationStatus.UNREAD), any());
    }

    @Test void readingAlreadyReadNotificationDoesNotFail() {
        when(repository.existsByIdAndUserId(7L, 2L)).thenReturn(true);
        when(repository.markRead(any(), any(), any(), any(), any())).thenReturn(0);
        assertThatCode(() -> service.read(2L, 7L)).doesNotThrowAnyException();
    }

    @Test void listsOnlyCurrentAccountAndClampsPagination() {
        when(repository.findByUserIdAndStatus(eq(2L), eq(NotificationStatus.UNREAD), any()))
                .thenAnswer(invocation -> new PageImpl<Notification>(List.of(), invocation.getArgument(2), 0));
        service.list(2L, true, -1, 1000);
        verify(repository).findByUserIdAndStatus(eq(2L), eq(NotificationStatus.UNREAD), argThat(page ->
                page.getPageNumber() == 0 && page.getPageSize() == 50
                && page.getSort().getOrderFor("createdAt").isDescending()));
        verify(repository, never()).findByUserId(any(), any());
    }

    @Test void broadcastsOnlyToActiveAdministrators() {
        User first = new User(); User second = new User();
        when(users.findByRoleAndActiveTrueAndDeletedAtIsNull(UserRole.ADMIN)).thenReturn(List.of(first, second));
        service.notifyAdmins("Địa điểm mới", "Một địa điểm vừa được tạo.");
        verify(repository).save(argThat(n -> n.getUser() == first && n.getStatus() == NotificationStatus.UNREAD));
        verify(repository).save(argThat(n -> n.getUser() == second && n.getStatus() == NotificationStatus.UNREAD));
    }
}
