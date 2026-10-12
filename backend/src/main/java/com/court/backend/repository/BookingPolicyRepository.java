package com.court.backend.repository;

import com.court.backend.entity.BookingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingPolicyRepository extends JpaRepository<BookingPolicy, Long> {
}