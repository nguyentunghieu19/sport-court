package com.court.backend.repository;

import com.court.backend.entity.SportsField;
import com.court.backend.enums.FieldStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SportsFieldRepository extends JpaRepository<SportsField, Long> {

    List<SportsField> findByVenueIdOrderByNameAsc(Long venueId);

    Optional<SportsField> findByIdAndVenueId(Long id, Long venueId);

    boolean existsByVenueIdAndNameIgnoreCase(Long venueId, String name);

    boolean existsByVenueIdAndNameIgnoreCaseAndIdNot(Long venueId, String name, Long id);

    List<SportsField> findByVenueIdInAndStatus(Collection<Long> venueIds, FieldStatus status);

    List<SportsField> findByVenueIdAndStatusInOrderByNameAsc(Long venueId, Collection<FieldStatus> statuses);
}