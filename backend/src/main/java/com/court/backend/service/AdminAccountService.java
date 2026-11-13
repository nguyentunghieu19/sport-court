package com.court.backend.service;

import com.court.backend.dto.request.AdminUserRequest;
import com.court.backend.dto.response.*;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import jakarta.persistence.criteria.Predicate;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAccountService {
  private final UserRepository users;
  private final VenueRepository venues;
  private final VenueStaffRepository assignments;
  private final AdminAccessService access;
  private final PasswordEncoder passwords;

  @Transactional(readOnly = true)
  public PageResponse<AdminUserResponse> list(
      Long actor, String keyword, UserRole role, Boolean active, int page, int size) {
    access.requireAdmin(actor);
    Specification<User> spec =
        (root, q, cb) -> {
          List<Predicate> p = new ArrayList<>();
          p.add(cb.isNull(root.get("deletedAt")));
          if (role != null) p.add(cb.equal(root.get("role"), role));
          if (active != null) p.add(cb.equal(root.get("active"), active));
          if (keyword != null && !keyword.isBlank()) {
            String like = "%" + escape(keyword.trim().toLowerCase(Locale.ROOT)) + "%";
            p.add(
                cb.or(
                    cb.like(cb.lower(root.get("fullName")), like, '\\'),
                    cb.like(cb.lower(root.get("email")), like, '\\'),
                    cb.like(root.get("phone"), like, '\\')));
          }
          return cb.and(p.toArray(new Predicate[0]));
        };
    return PageResponse.from(
        users
            .findAll(
                spec,
                PageRequest.of(
                    Math.max(page, 0),
                    Math.min(Math.max(size, 1), 100),
                    Sort.by("id").descending()))
            .map(AdminUserResponse::from));
  }

  @Transactional
  public AdminUserResponse create(Long actor, AdminUserRequest r) {
    users.lockActiveAdministrators();
    access.requireAdmin(actor);
    User user = new User();
    apply(user, r, true);
    return AdminUserResponse.from(users.saveAndFlush(user));
  }

  @Transactional
  public AdminUserResponse update(Long actor, Long id, AdminUserRequest r) {
    List<User> admins = users.lockActiveAdministrators();
    access.requireAdmin(actor);
    User u = target(id);
    if (id.equals(actor) && (r.role() != UserRole.ADMIN || !r.active()))
      throw conflict("Bạn không thể tự hạ quyền hoặc khóa tài khoản quản trị đang sử dụng");
    if (u.getRole() == UserRole.ADMIN
        && u.isActive()
        && (r.role() != UserRole.ADMIN || !r.active())
        && admins.size() <= 1) throw conflict("Phải giữ ít nhất một quản trị viên đang hoạt động");
    if (u.getRole() != r.role()) {
      if (u.getRole() == UserRole.OWNER && venues.existsByOwnerId(id))
        throw conflict("Không thể đổi vai trò chủ sân đang sở hữu địa điểm");
      if (u.getRole() == UserRole.STAFF && assignments.existsByStaffId(id))
        throw conflict("Không thể đổi vai trò nhân viên đã có phân công địa điểm");
    }
    if (u.getRole() != r.role()
        || u.isActive() != r.active()
        || (r.password() != null && !r.password().isBlank()))
      u.setTokenVersion(u.getTokenVersion() + 1);
    apply(u, r, false);
    return AdminUserResponse.from(users.saveAndFlush(u));
  }

  @Transactional
  public void delete(Long actor, Long id) {
    List<User> admins = users.lockActiveAdministrators();
    access.requireAdmin(actor);
    User u = target(id);
    if (id.equals(actor)) throw conflict("Bạn không thể tự xóa tài khoản quản trị đang sử dụng");
    if (u.getRole() == UserRole.ADMIN && u.isActive() && admins.size() <= 1)
      throw conflict("Phải giữ ít nhất một quản trị viên đang hoạt động");
    u.setTokenVersion(u.getTokenVersion() + 1);
    u.setActive(false);
    u.setDeletedAt(Instant.now());
    // Giải phóng thông tin đăng nhập; lịch sử vẫn tham chiếu ID tài khoản cũ.
    u.setEmail(null);
    u.setPhone(null);
    u.setEmailVerified(false);
    u.setPhoneVerified(false);
    users.saveAndFlush(u);
  }

  private User target(Long id) {
    return users
        .findById(id)
        .filter(u -> u.getDeletedAt() == null)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
  }

  private void apply(User u, AdminUserRequest r, boolean create) {
    String email = clean(r.email());
    if (email != null) email = email.toLowerCase(Locale.ROOT);
    String phone = clean(r.phone());
    if (phone != null) phone = phone.replace(" ", "");
    if (email == null && phone == null)
      throw new ApiException(HttpStatus.BAD_REQUEST, "Cần nhập email hoặc số điện thoại");
    if (email != null
        && (create ? users.existsByEmail(email) : users.existsByEmailAndIdNot(email, u.getId())))
      throw conflict("Email đã được sử dụng");
    if (phone != null
        && (create ? users.existsByPhone(phone) : users.existsByPhoneAndIdNot(phone, u.getId())))
      throw conflict("Số điện thoại đã được sử dụng");
    String password = r.password();
    if (create || (password != null && !password.isBlank())) {
      if (password == null
          || password.isBlank()
          || password.length() < 8
          || password.getBytes(StandardCharsets.UTF_8).length > 72)
        throw new ApiException(
            HttpStatus.BAD_REQUEST, "Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8");
      u.setPasswordHash(passwords.encode(password));
    }
    u.setFullName(r.fullName().trim());
    u.setEmail(email);
    u.setPhone(phone);
    u.setRole(r.role());
    u.setActive(r.active());
  }

  private String clean(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private String escape(String s) {
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
  }

  private ApiException conflict(String s) {
    return new ApiException(HttpStatus.CONFLICT, s);
  }
}
