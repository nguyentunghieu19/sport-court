package com.court.backend.service;

import com.court.backend.dto.request.PolicyRequest;
import com.court.backend.dto.response.PolicyResponse;
import com.court.backend.entity.BookingPolicy;
import com.court.backend.entity.Venue;
import com.court.backend.repository.BookingPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final BookingPolicyRepository bookingPolicyRepository;
    private final OwnerAccessService ownerAccessService;

    @Transactional
    public PolicyResponse get(Long ownerId, Long venueId) {
        Venue venue = ownerAccessService.requireOwnedVenue(ownerId, venueId);
        return PolicyResponse.from(findOrCreate(venue));
    }

    @Transactional
    public PolicyResponse update(Long ownerId, Long venueId, PolicyRequest request) {
        Venue venue = ownerAccessService.requireOwnedVenue(ownerId, venueId);
        BookingPolicy policy = findOrCreate(venue);

        policy.setDepositPercentage(request.depositPercentage());
        policy.setCancellationDeadlineHours(request.cancellationDeadlineHours());
        policy.setDepositRefundableOnCustomerCancel(request.depositRefundableOnCustomerCancel());
        policy.setFullPaymentRefundableBeforeDeadline(request.fullPaymentRefundableBeforeDeadline());
        policy.setOwnerCancellationFullRefund(request.ownerCancellationFullRefund());
        policy.setPaymentTimeoutMinutes(request.paymentTimeoutMinutes());

        return PolicyResponse.from(bookingPolicyRepository.save(policy));
    }

    // Địa điểm chưa có chính sách (ví dụ tạo bằng SQL) thì tạo một dòng với giá trị mặc định
    private BookingPolicy findOrCreate(Venue venue) {
        return bookingPolicyRepository.findByVenueId(venue.getId()).orElseGet(() -> {
            BookingPolicy policy = new BookingPolicy();
            policy.setVenue(venue);
            return bookingPolicyRepository.save(policy);
        });
    }
}