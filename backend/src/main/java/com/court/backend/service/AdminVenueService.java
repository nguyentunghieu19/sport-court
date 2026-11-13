package com.court.backend.service;

import com.court.backend.dto.request.AdminVenueVisibilityRequest;
import com.court.backend.dto.response.*;
import com.court.backend.entity.Venue;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.*;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminVenueService {
  private final VenueRepository venues;
  private final SportsFieldRepository fields;
  private final AdminAccessService access;

  @Transactional(readOnly = true)
  public PageResponse<AdminVenueResponse> list(
      Long actor, String keyword, Boolean hidden, VenueStatus status, int page, int size) {
    access.requireAdmin(actor);
    Specification<Venue> spec =
        (root, q, cb) -> {
          List<Predicate> p = new ArrayList<>();
          if (hidden != null) p.add(cb.equal(root.get("adminHidden"), hidden));
          if (status != null) p.add(cb.equal(root.get("status"), status));
          if (keyword != null && !keyword.isBlank()) {
            String like =
                "%"
                    + keyword
                        .trim()
                        .toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_")
                    + "%";
            p.add(
                cb.or(
                    cb.like(cb.lower(root.get("name")), like, '\\'),
                    cb.like(cb.lower(root.get("address")), like, '\\'),
                    cb.like(cb.lower(root.get("owner").get("fullName")), like, '\\')));
          }
          return cb.and(p.toArray(new Predicate[0]));
        };
    return PageResponse.from(
        venues
            .findAll(
                spec,
                PageRequest.of(
                    Math.max(0, page),
                    Math.min(Math.max(1, size), 100),
                    Sort.by("id").descending()))
            .map(this::response));
  }

  @Transactional(readOnly = true)
  public AdminVenueResponse detail(Long actor, Long id) {
    access.requireAdmin(actor);
    return response(venues.findById(id).orElseThrow(() -> notFound()));
  }

  @Transactional
  public AdminVenueResponse visibility(Long actor, Long id, AdminVenueVisibilityRequest r) {
    var admin = access.requireAdmin(actor);
    Venue v = venues.findForAdminUpdate(id).orElseThrow(() -> notFound());
    String reason = r.reason() == null ? null : r.reason().trim();
    if (r.hidden() && (reason == null || reason.isBlank()))
      throw new ApiException(HttpStatus.BAD_REQUEST, "Cần nhập lý do tạm ẩn địa điểm");
    v.setAdminHidden(r.hidden());
    v.setAdminHiddenReason(r.hidden() ? reason : null);
    v.setAdminHiddenAt(r.hidden() ? Instant.now() : null);
    v.setAdminHiddenBy(r.hidden() ? admin : null);
    venues.saveAndFlush(v);
    return response(v);
  }

  private AdminVenueResponse response(Venue v) {
    return AdminVenueResponse.from(
        v,
        fields.findByVenueIdOrderByNameAsc(v.getId()).stream().map(FieldResponse::from).toList());
  }

  private ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm");
  }
}
