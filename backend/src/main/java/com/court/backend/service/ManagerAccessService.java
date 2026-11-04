package com.court.backend.service;

import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.UserRepository;
import com.court.backend.repository.VenueRepository;
import com.court.backend.repository.VenueStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Kiểm tra quyền của người quản lý: chủ sân (OWNER) hoặc nhân viên (STAFF) được phân công địa điểm
@Service
@RequiredArgsConstructor
public class ManagerAccessService {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final VenueStaffRepository venueStaffRepository;

    // Kiểm tra lại vai trò trong database, không chỉ tin vào token
    @Transactional(readOnly = true)
    public User requireManager(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }
        if (user.getRole() != UserRole.OWNER && user.getRole() != UserRole.STAFF) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này");
        }
        return user;
    }

    // Danh sách địa điểm người này được quản lý
    @Transactional(readOnly = true)
    public List<Long> manageableVenueIds(User manager) {
        if (manager.getRole() == UserRole.OWNER) {
            return venueRepository.findIdsByOwnerId(manager.getId());
        }
        return venueStaffRepository.findActiveVenueIdsByStaffId(manager.getId());
    }
}