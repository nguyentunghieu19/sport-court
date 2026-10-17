package com.court.backend.service;

import com.court.backend.dto.request.FieldRequest;
import com.court.backend.dto.request.FieldStatusRequest;
import com.court.backend.dto.response.FieldResponse;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.Venue;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.SportsFieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FieldService {

    private final SportsFieldRepository sportsFieldRepository;
    private final OwnerAccessService ownerAccessService;

    @Transactional
    public FieldResponse create(Long ownerId, Long venueId, FieldRequest request) {
        Venue venue = ownerAccessService.requireOwnedVenue(ownerId, venueId);
        String name = request.name().trim();

        if (sportsFieldRepository.existsByVenueIdAndNameIgnoreCase(venueId, name)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên sân đã tồn tại trong địa điểm này");
        }

        SportsField field = new SportsField();
        field.setVenue(venue);
        applyRequest(field, request);
        return FieldResponse.from(sportsFieldRepository.save(field));
    }

    @Transactional(readOnly = true)
    public List<FieldResponse> list(Long ownerId, Long venueId) {
        ownerAccessService.requireOwnedVenue(ownerId, venueId);
        return sportsFieldRepository.findByVenueIdOrderByNameAsc(venueId).stream()
                .map(FieldResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FieldResponse get(Long ownerId, Long venueId, Long fieldId) {
        ownerAccessService.requireOwnedVenue(ownerId, venueId);
        return FieldResponse.from(findField(venueId, fieldId));
    }

    @Transactional
    public FieldResponse update(Long ownerId, Long venueId, Long fieldId, FieldRequest request) {
        ownerAccessService.requireOwnedVenue(ownerId, venueId);
        SportsField field = findField(venueId, fieldId);
        String name = request.name().trim();

        if (sportsFieldRepository.existsByVenueIdAndNameIgnoreCaseAndIdNot(venueId, name, fieldId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên sân đã tồn tại trong địa điểm này");
        }

        applyRequest(field, request);
        return FieldResponse.from(sportsFieldRepository.save(field));
    }

    @Transactional
    public FieldResponse changeStatus(Long ownerId, Long venueId, Long fieldId, FieldStatusRequest request) {
        ownerAccessService.requireOwnedVenue(ownerId, venueId);
        SportsField field = findField(venueId, fieldId);
        field.setStatus(request.status());
        return FieldResponse.from(sportsFieldRepository.save(field));
    }

    // Sân của địa điểm khác được coi như không tồn tại
    private SportsField findField(Long venueId, Long fieldId) {
        return sportsFieldRepository.findByIdAndVenueId(fieldId, venueId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy sân"));
    }

    private void applyRequest(SportsField field, FieldRequest request) {
        field.setName(request.name().trim());
        field.setSportType(request.sportType().name());
        field.setDescription(blankToNull(request.description()));
        field.setImageUrl(blankToNull(request.imageUrl()));
        field.setCapacity(request.capacity());
        field.setBasePrice(request.basePrice());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}