package com.court.backend.controller;

import com.court.backend.config.SecurityConfig;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.repository.UserRepository;
import com.court.backend.service.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NotificationController.class, properties = {
        "app.jwt.secret=notification-test-only-secret-more-than-32-characters", "app.jwt.expiration-minutes=60"})
@ContextConfiguration(classes = {NotificationController.class, SecurityConfig.class, JwtService.class})
class NotificationSecurityTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean UserRepository users;
    @MockitoBean NotificationService service;

    @Test void anonymousCannotReadInbox() throws Exception {
        mvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test void customerCannotUseManagementInbox() throws Exception {
        mvc.perform(get("/api/notifications/summary").header("Authorization", token(UserRole.USER)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @ParameterizedTest @EnumSource(value = UserRole.class, names = {"ADMIN", "OWNER", "STAFF"})
    void summaryAndReadUseJwtSubjectNotClientUserId(UserRole role) throws Exception {
        String bearer = token(role);
        when(service.unreadCount(2L)).thenReturn(3L);
        mvc.perform(get("/api/notifications/summary?userId=999").header("Authorization", bearer))
                .andExpect(status().isOk()).andExpect(jsonPath("unreadCount").value(3));
        mvc.perform(patch("/api/notifications/7/read?userId=999").header("Authorization", bearer))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/notifications/read-all?userId=999").header("Authorization", bearer))
                .andExpect(status().isOk());
        verify(service).read(2L, 7L);
        verify(service).readAll(2L);
    }

    private String token(UserRole role) {
        User user = new User(); user.setId(2L); user.setRole(role);
        when(users.findById(2L)).thenReturn(Optional.of(user));
        return "Bearer " + jwt.generateToken(user);
    }
}
