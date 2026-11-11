package com.court.backend.repository;

import com.court.backend.entity.Venue;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VenueRepository extends JpaRepository<Venue, Long>, JpaSpecificationExecutor<Venue> {

    List<Venue> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Venue> findByIdAndOwnerId(Long id, Long ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Venue v where v.id = :id and v.owner.id = :ownerId")
    Optional<Venue> findOwnedForUpdate(@Param("id") Long id, @Param("ownerId") Long ownerId);

    @Query("select v.id from Venue v where v.owner.id = :ownerId")
    List<Long> findIdsByOwnerId(@Param("ownerId") Long ownerId);
}
