package com.court.backend.config;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;

class AccountJwtAuthenticationConverterTest {
  UserRepository users;
  User user;
  AccountJwtAuthenticationConverter converter;

  @BeforeEach
  void setup() {
    users = mock(UserRepository.class);
    user = new User();
    user.setId(1L);
    user.setRole(UserRole.ADMIN);
    when(users.findById(1L)).thenReturn(Optional.of(user));
    converter = new AccountJwtAuthenticationConverter(users);
  }

  @Test
  void validRoleAndVersionAccepted() {
    assertThat(converter.convert(token("ADMIN", 0L)).getAuthorities())
        .extracting("authority")
        .containsExactly("ROLE_ADMIN");
  }

  @Test
  void lockedDeletedAndChangedRolesRejected() {
    user.setActive(false);
    assertThatThrownBy(() -> converter.convert(token("ADMIN", 0L)))
        .isInstanceOf(OAuth2AuthenticationException.class);
    user.setActive(true);
    user.setDeletedAt(java.time.Instant.now());
    assertThatThrownBy(() -> converter.convert(token("ADMIN", 0L)))
        .isInstanceOf(OAuth2AuthenticationException.class);
    user.setDeletedAt(null);
    user.setRole(UserRole.USER);
    assertThatThrownBy(() -> converter.convert(token("ADMIN", 0L)))
        .isInstanceOf(OAuth2AuthenticationException.class);
  }

  @Test
  void oldVersionCannotReviveAfterUnlock() {
    user.setTokenVersion(2);
    assertThatThrownBy(() -> converter.convert(token("ADMIN", 1L)))
        .isInstanceOf(OAuth2AuthenticationException.class);
    assertThat(converter.convert(token("ADMIN", 2L))).isNotNull();
  }

  @Test
  void legacyTokenAllowedOnlyForVersionZero() {
    Jwt token =
        Jwt.withTokenValue("test")
            .header("alg", "HS256")
            .subject("1")
            .claim("role", "ADMIN")
            .build();
    assertThat(converter.convert(token)).isNotNull();
    user.setTokenVersion(1);
    assertThatThrownBy(() -> converter.convert(token))
        .isInstanceOf(OAuth2AuthenticationException.class);
  }

  private Jwt token(String role, long version) {
    return Jwt.withTokenValue("test")
        .header("alg", "HS256")
        .subject("1")
        .claim("role", role)
        .claim("tokenVersion", version)
        .build();
  }
}
