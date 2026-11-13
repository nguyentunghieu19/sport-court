package com.court.backend.service;

import com.court.backend.config.AccountJwtAuthenticationConverter;
import com.court.backend.dto.request.LoginRequest;
import com.court.backend.dto.request.RegisterRequest;
import com.court.backend.entity.Booking;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.repository.UserRepository;
import com.court.backend.repository.VenueRepository;
import com.court.backend.repository.VenueStaffRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RegistrationAfterAccountDeletionTest {
    @Test
    void reusedContactsCreateNewIdentityWithoutOldPrivilegesHistoryOrSessions() {
        var users = mock(UserRepository.class);
        var records = new HashMap<Long, User>();
        var sequence = new AtomicLong();
        when(users.findById(anyLong())).thenAnswer(i -> Optional.ofNullable(records.get(i.getArgument(0))));
        when(users.findByEmail(anyString())).thenAnswer(i -> records.values().stream()
                .filter(u -> i.getArgument(0).equals(u.getEmail())).findFirst());
        when(users.findByPhone(anyString())).thenAnswer(i -> records.values().stream()
                .filter(u -> i.getArgument(0).equals(u.getPhone())).findFirst());
        when(users.existsByEmail(anyString())).thenAnswer(i -> records.values().stream()
                .anyMatch(u -> i.getArgument(0).equals(u.getEmail())));
        when(users.existsByPhone(anyString())).thenAnswer(i -> records.values().stream()
                .anyMatch(u -> i.getArgument(0).equals(u.getPhone())));
        when(users.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            if (u.getId() == null) u.setId(sequence.incrementAndGet());
            records.put(u.getId(), u); return u;
        });
        when(users.saveAndFlush(any(User.class))).thenAnswer(i -> i.getArgument(0));
        var jwt = mock(JwtService.class);
        when(jwt.generateToken(any())).thenReturn("test-token");
        when(jwt.getExpiresInSeconds()).thenReturn(3600L);
        var encoder = new BCryptPasswordEncoder();
        var auth = new AuthService(users, encoder, jwt);
        var original = auth.registerOwner(new RegisterRequest("Chủ sân cũ", "reuse@example.test", "0912345678", "OldPassword123!"));
        User oldUser = records.get(original.userId());
        oldUser.setEmailVerified(true); oldUser.setPhoneVerified(true);
        Booking history = new Booking(); history.setUser(oldUser);
        Jwt oldToken = token(oldUser);
        User admin = new User(); admin.setId(100L); admin.setRole(UserRole.ADMIN);
        when(users.lockActiveAdministrators()).thenReturn(List.of(admin));
        var access = mock(AdminAccessService.class);
        when(access.requireAdmin(100L)).thenReturn(admin);
        var accounts = new AdminAccountService(users, mock(VenueRepository.class), mock(VenueStaffRepository.class), access, encoder);

        accounts.delete(100L, oldUser.getId());
        var fresh = auth.register(new RegisterRequest("Khách hàng mới", "reuse@example.test", "0912345678", "NewPassword123!"));

        assertThat(fresh.userId()).isNotEqualTo(original.userId());
        assertThat(fresh.role()).isEqualTo("USER");
        assertThat(records).hasSize(2).containsKey(original.userId());
        assertThat(history.getUser().getId()).isEqualTo(original.userId());
        assertThat(oldUser.getDeletedAt()).isNotNull();
        User newUser = records.get(fresh.userId());
        assertThat(newUser.isEmailVerified()).isFalse();
        assertThat(newUser.isPhoneVerified()).isFalse();
        assertThat(newUser.getDeletedAt()).isNull();
        assertThat(newUser.getTokenVersion()).isZero();
        var converter = new AccountJwtAuthenticationConverter(users);
        assertThatThrownBy(() -> converter.convert(oldToken)).isInstanceOf(OAuth2AuthenticationException.class);
        assertThat(converter.convert(token(newUser)).getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
        assertThat(auth.login(new LoginRequest("reuse@example.test", "NewPassword123!")).userId()).isEqualTo(fresh.userId());
        assertThat(auth.login(new LoginRequest("0912345678", "NewPassword123!")).userId()).isEqualTo(fresh.userId());
        assertThatThrownBy(() -> auth.login(new LoginRequest("reuse@example.test", "OldPassword123!")))
                .hasMessage("Tài khoản hoặc mật khẩu không đúng");
        assertThatThrownBy(() -> auth.register(new RegisterRequest("Trùng liên hệ", "reuse@example.test", null, "Password123!")))
                .hasMessage("Email đã được sử dụng");
        verify(users, never()).delete(any(User.class));
    }

    private Jwt token(User user) {
        return Jwt.withTokenValue("test-token").header("alg", "HS256")
                .subject(user.getId().toString()).claim("role", user.getRole().name())
                .claim("tokenVersion", user.getTokenVersion()).build();
    }
}
