package com.court.backend.service;

import com.court.backend.entity.SportsField;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.UserRepository;
import com.court.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Nơi duy nhất kiểm tra quyền của OWNER; các service quản lý khác dùng lại
@Service
@RequiredArgsConstructor
public class OwnerAccessService {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final SportsFieldRepository sportsFieldRepository;

    // Kiểm tra lại vai trò trong database, không chỉ tin vào token
    @Transactional(readOnly = true)
    public User requireActiveOwner(Long ownerId) {
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }
        if (user.getRole() != UserRole.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này");
        }
        return user;
    }

    // Địa điểm của người khác được coi như không tồn tại (trả 404, không tiết lộ)
    @Transactional(readOnly = true)
    public Venue requireOwnedVenue(Long ownerId, Long venueId) {
        requireActiveOwner(ownerId);
        return venueRepository.findByIdAndOwnerId(venueId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm"));
    }

    // Sân phải thuộc địa điểm, và địa điểm phải thuộc OWNER
    @Transactional(readOnly = true)
    public SportsField requireOwnedField(Long ownerId, Long venueId, Long fieldId) {
        requireOwnedVenue(ownerId, venueId);
        return sportsFieldRepository.findByIdAndVenueId(fieldId, venueId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy sân"));
    }
}