package com.court.backend.repository;

import com.court.backend.entity.SportsField;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SportsFieldRepository extends JpaRepository<SportsField, Long> {
}