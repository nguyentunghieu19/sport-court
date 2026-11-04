package com.court.backend.repository;

import com.court.backend.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VenueRepository extends JpaRepository<Venue, Long>, JpaSpecificationExecutor<Venue> {

    List<Venue> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Venue> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("select v.id from Venue v where v.owner.id = :ownerId")
    List<Long> findIdsByOwnerId(@Param("ownerId") Long ownerId);
}