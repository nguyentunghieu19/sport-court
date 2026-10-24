package com.court.backend.repository;

import com.court.backend.entity.BookingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {

    Optional<BookingPolicy> findByVenueId(Long venueId);
}