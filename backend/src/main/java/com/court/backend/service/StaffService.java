package com.court.backend.service;

import com.court.backend.dto.request.StaffCreateRequest;
import com.court.backend.dto.request.StaffUpdateRequest;
import com.court.backend.dto.response.StaffResponse;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.entity.VenueStaff;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.UserRepository;
import com.court.backend.repository.VenueRepository;
import com.court.backend.repository.VenueStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final VenueStaffRepository venueStaffRepository;
    private final OwnerAccessService ownerAccessService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StaffResponse create(Long ownerId, StaffCreateRequest request) {
        User owner = ownerAccessService.requireActiveOwner(ownerId);

        String email = normalizeEmail(request.email());
        String phone = normalizePhone(request.phone());
        if (email == null && phone == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cần nhập email hoặc số điện thoại");
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng");
        }

        // Mọi địa điểm được phân công phải thuộc chủ sân này
        Set<Long> venueIds = new HashSet<>(request.venueIds());
        List<Venue> venues = venueIds.stream()
                .map(venueId -> ownerAccessService.requireOwnedVenue(ownerId, venueId))
                .toList();

        User staff = new User();
        staff.setFullName(request.fullName().trim());
        staff.setEmail(email);
        staff.setPhone(phone);
        staff.setPasswordHash(passwordEncoder.encode(request.password()));
        staff.setRole(UserRole.STAFF);
        staff = userRepository.save(staff);

        for (Venue venue : venues) {
            VenueStaff assignment = new VenueStaff();
            assignment.setVenue(venue);
            assignment.setStaff(staff);
            assignment.setAssignedBy(owner);
            venueStaffRepository.save(assignment);
        }
        venueStaffRepository.flush();

        return buildResponse(staff, ownerId);
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> list(Long ownerId, Long venueId) {
        ownerAccessService.requireActiveOwner(ownerId);

        List<Long> staffIds;
        if (venueId != null) {
            ownerAccessService.requireOwnedVenue(ownerId, venueId);
            staffIds = venueStaffRepository.findStaffIdsByVenueId(venueId);
        } else {
            staffIds = venueStaffRepository.findStaffIdsByOwnerId(ownerId);
        }
        if (staffIds.isEmpty()) {
            return List.of();
        }

        Map<Long, List<VenueStaff>> assignmentsByStaff = venueStaffRepository
                .findByStaffIdInAndVenueOwnerId(staffIds, ownerId).stream()
                .collect(Collectors.groupingBy(assignment -> assignment.getStaff().getId()));

        return userRepository.findAllById(staffIds).stream()
                .filter(user -> user.getRole() == UserRole.STAFF)
                .sorted(Comparator.comparing(User::getFullName, String.CASE_INSENSITIVE_ORDER))
                .map(user -> toResponse(user, assignmentsByStaff.getOrDefault(user.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffResponse get(Long ownerId, Long staffId) {
        ownerAccessService.requireActiveOwner(ownerId);
        return buildResponse(requireStaffOfOwner(ownerId, staffId), ownerId);
    }

    @Transactional
    public StaffResponse update(Long ownerId, Long staffId, StaffUpdateRequest request) {
        ownerAccessService.requireActiveOwner(ownerId);
        User staff = requireStaffOfOwner(ownerId, staffId);

        String email = normalizeEmail(request.email());
        String phone = normalizePhone(request.phone());
        if (email == null && phone == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cần nhập email hoặc số điện thoại");
        }
        if (email != null && userRepository.existsByEmailAndIdNot(email, staffId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
        if (phone != null && userRepository.existsByPhoneAndIdNot(phone, staffId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng");
        }

        staff.setFullName(request.fullName().trim());
        staff.setEmail(email);
        staff.setPhone(phone);
        userRepository.saveAndFlush(staff);

        return buildResponse(staff, ownerId);
    }

    // Khóa hoặc mở khóa tài khoản: có hiệu lực ngay vì mỗi yêu cầu đều kiểm tra lại trạng thái trong database
    @Transactional
    public StaffResponse setStatus(Long ownerId, Long staffId, boolean active) {
        ownerAccessService.requireActiveOwner(ownerId);
        User staff = requireStaffOfOwner(ownerId, staffId);

        staff.setActive(active);
        userRepository.saveAndFlush(staff);
        return buildResponse(staff, ownerId);
    }

    // Đặt lại phạm vi địa điểm: địa điểm có trong danh sách thì phân công, địa điểm của chủ sân không có trong danh sách thì gỡ
    @Transactional
    public StaffResponse setVenues(Long ownerId, Long staffId, List<Long> requestedVenueIds) {
        User owner = ownerAccessService.requireActiveOwner(ownerId);
        User staff = requireStaffOfOwner(ownerId, staffId);

        List<Venue> ownerVenues = venueRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        Set<Long> ownerVenueIds = ownerVenues.stream().map(Venue::getId).collect(Collectors.toSet());
        Set<Long> wanted = new HashSet<>(requestedVenueIds);
        for (Long venueId : wanted) {
            if (!ownerVenueIds.contains(venueId)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm");
            }
        }

        Map<Long, VenueStaff> existing = new HashMap<>();
        for (VenueStaff assignment : venueStaffRepository.findByStaffIdAndVenueOwnerId(staffId, ownerId)) {
            existing.put(assignment.getVenue().getId(), assignment);
        }

        for (Venue venue : ownerVenues) {
            boolean want = wanted.contains(venue.getId());
            VenueStaff assignment = existing.get(venue.getId());
            if (assignment == null) {
                if (want) {
                    VenueStaff created = new VenueStaff();
                    created.setVenue(venue);
                    created.setStaff(staff);
                    created.setAssignedBy(owner);
                    venueStaffRepository.save(created);
                }
            } else if (assignment.isActive() != want) {
                assignment.setActive(want);
            }
        }
        venueStaffRepository.flush();

        return buildResponse(staff, ownerId);
    }

    @Transactional
    public void resetPassword(Long ownerId, Long staffId, String newPassword) {
        ownerAccessService.requireActiveOwner(ownerId);
        User staff = requireStaffOfOwner(ownerId, staffId);

        staff.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(staff);
    }

    // Nhân viên phải có liên kết với địa điểm của chủ sân này, nếu không coi như không tồn tại
    private User requireStaffOfOwner(Long ownerId, Long staffId) {
        if (!venueStaffRepository.existsByStaffIdAndVenueOwnerId(staffId, ownerId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên");
        }
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
        if (staff.getRole() != UserRole.STAFF) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên");
        }
        return staff;
    }

    private StaffResponse buildResponse(User staff, Long ownerId) {
        return toResponse(staff, venueStaffRepository.findByStaffIdAndVenueOwnerId(staff.getId(), ownerId));
    }

    private StaffResponse toResponse(User staff, List<VenueStaff> assignments) {
        List<StaffResponse.VenueAssignment> venues = assignments.stream()
                .sorted(Comparator.comparing(assignment -> assignment.getVenue().getName(),
                        String.CASE_INSENSITIVE_ORDER))
                .map(assignment -> new StaffResponse.VenueAssignment(
                        assignment.getVenue().getId(),
                        assignment.getVenue().getName(),
                        assignment.isActive(),
                        assignment.getAssignedAt()))
                .toList();

        return new StaffResponse(
                staff.getId(),
                staff.getFullName(),
                staff.getEmail(),
                staff.getPhone(),
                staff.getRole().name(),
                staff.isActive(),
                staff.getCreatedAt(),
                venues);
    }

    private String normalizeEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim().replace(" ", "");
    }
}