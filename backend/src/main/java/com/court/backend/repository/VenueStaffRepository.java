package com.court.backend.repository;

import com.court.backend.entity.VenueStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VenueStaffRepository extends JpaRepository<VenueStaff, Long> {

    // Các địa điểm mà nhân viên đang được phân công
    @Query("select vs.venue.id from VenueStaff vs where vs.staff.id = :staffId and vs.active = true")
    List<Long> findActiveVenueIdsByStaffId(@Param("staffId") Long staffId);
}