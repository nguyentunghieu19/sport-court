package com.court.backend.service;

import com.court.backend.dto.response.FieldResponse;
import com.court.backend.dto.response.ManagedVenueResponse;
import com.court.backend.entity.User;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerVenueService {

    private final VenueRepository venueRepository;
    private final SportsFieldRepository sportsFieldRepository;
    private final ManagerAccessService managerAccessService;

    // Chủ sân: địa điểm của mình; nhân viên: các địa điểm được phân công
    @Transactional(readOnly = true)
    public List<ManagedVenueResponse> listVenues(Long managerId) {
        User manager = managerAccessService.requireManager(managerId);
        List<Long> venueIds = managerAccessService.manageableVenueIds(manager);
        if (venueIds.isEmpty()) {
            return List.of();
        }
        return venueRepository.findAllById(venueIds).stream()
                .sorted(Comparator.comparing(venue -> venue.getName(), String.CASE_INSENSITIVE_ORDER))
                .map(ManagedVenueResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FieldResponse> listFields(Long managerId, Long venueId) {
        User manager = managerAccessService.requireManager(managerId);
        if (!managerAccessService.manageableVenueIds(manager).contains(venueId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm");
        }
        return sportsFieldRepository.findByVenueIdOrderByNameAsc(venueId).stream()
                .map(FieldResponse::from)
                .toList();
    }
}