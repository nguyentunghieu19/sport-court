package com.court.backend.repository;

import com.court.backend.entity.FieldBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface FieldBlockRepository extends JpaRepository<FieldBlock, Long> {

    List<FieldBlock> findByFieldIdAndActiveTrueAndStartAtLessThanAndEndAtGreaterThan(
            Long fieldId, Instant windowEnd, Instant windowStart);
}