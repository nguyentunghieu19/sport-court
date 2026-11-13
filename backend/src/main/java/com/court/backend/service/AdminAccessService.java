package com.court.backend.service;

import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAccessService {
  private final UserRepository users;

  public User requireAdmin(Long id) {
    User u =
        users
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.FORBIDDEN, "Không có quyền quản trị hệ thống"));
    if (!u.isActive() || u.getDeletedAt() != null || u.getRole() != UserRole.ADMIN)
      throw new ApiException(HttpStatus.FORBIDDEN, "Không có quyền quản trị hệ thống");
    return u;
  }
}
