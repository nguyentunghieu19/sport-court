package com.court.backend.config;

import com.court.backend.repository.UserRepository;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public class AccountJwtAuthenticationConverter
    implements Converter<Jwt, AbstractAuthenticationToken> {
  private final UserRepository users;

  public AccountJwtAuthenticationConverter(UserRepository users) {
    this.users = users;
  }

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Long id;
    try {
      id = Long.valueOf(jwt.getSubject());
    } catch (RuntimeException ex) {
      throw invalid();
    }
    var user = users.findById(id).orElseThrow(this::invalid);
    Object claim = jwt.getClaim("tokenVersion");
    long version = claim instanceof Number n ? n.longValue() : 0;
    if (!user.isActive()
        || user.getDeletedAt() != null
        || !user.getRole().name().equals(jwt.getClaimAsString("role"))
        || version != user.getTokenVersion()) throw invalid();
    return new JwtAuthenticationToken(
        jwt, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }

  private OAuth2AuthenticationException invalid() {
    return new OAuth2AuthenticationException(
        new OAuth2Error("invalid_token"), "Tài khoản hoặc phiên đăng nhập không còn hợp lệ");
  }
}
