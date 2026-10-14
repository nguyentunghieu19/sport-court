package com.court.backend.repository;

import com.court.backend.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    List<Venue> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Venue> findByIdAndOwnerId(Long id, Long ownerId);
}