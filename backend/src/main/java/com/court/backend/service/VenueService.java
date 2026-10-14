package com.court.backend.service;

import com.court.backend.dto.request.VenueRequest;
import com.court.backend.dto.request.VenueStatusRequest;
import com.court.backend.dto.response.VenueResponse;
import com.court.backend.entity.BookingPolicy;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingPolicyRepository;
import com.court.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;
    private final BookingPolicyRepository bookingPolicyRepository;
    private final OwnerAccessService ownerAccessService;

    @Transactional
    public VenueResponse create(Long ownerId, VenueRequest request) {
        User owner = ownerAccessService.requireActiveOwner(ownerId);
        validateHours(request);

        Venue venue = new Venue();
        venue.setOwner(owner);
        applyRequest(venue, request);
        venue = venueRepository.save(venue);

        // Mỗi địa điểm có một bộ chính sách đặt sân, tạo với giá trị mặc định của database
        BookingPolicy policy = new BookingPolicy();
        policy.setVenue(venue);
        bookingPolicyRepository.save(policy);

        return VenueResponse.from(venue);
    }

    @Transactional(readOnly = true)
    public List<VenueResponse> listMine(Long ownerId) {
        ownerAccessService.requireActiveOwner(ownerId);
        return venueRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(VenueResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VenueResponse getMine(Long ownerId, Long venueId) {
        return VenueResponse.from(ownerAccessService.requireOwnedVenue(ownerId, venueId));
    }

    @Transactional
    public VenueResponse update(Long ownerId, Long venueId, VenueRequest request) {
        validateHours(request);

        Venue venue = ownerAccessService.requireOwnedVenue(ownerId, venueId);
        applyRequest(venue, request);
        return VenueResponse.from(venueRepository.save(venue));
    }

    @Transactional
    public VenueResponse changeStatus(Long ownerId, Long venueId, VenueStatusRequest request) {
        Venue venue = ownerAccessService.requireOwnedVenue(ownerId, venueId);
        venue.setStatus(request.status());
        return VenueResponse.from(venueRepository.save(venue));
    }

    private void validateHours(VenueRequest request) {
        if (!request.openingTime().isBefore(request.closingTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ mở cửa phải trước giờ đóng cửa");
        }
    }

    private void applyRequest(Venue venue, VenueRequest request) {
        venue.setName(request.name().trim());
        venue.setAddress(request.address().trim());
        venue.setCity(request.city().trim());
        venue.setDistrict(request.district().trim());
        venue.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        venue.setPhone(request.phone() == null || request.phone().isBlank()
                ? null : request.phone().trim());
        venue.setOpeningTime(request.openingTime());
        venue.setClosingTime(request.closingTime());
    }
}