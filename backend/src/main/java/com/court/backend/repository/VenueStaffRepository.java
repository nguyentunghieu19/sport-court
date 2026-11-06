package com.court.backend.repository;

import com.court.backend.entity.VenueStaff;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface VenueStaffRepository extends JpaRepository<VenueStaff, Long> {

    // Các địa điểm mà nhân viên đang được phân công
    @Query("select vs.venue.id from VenueStaff vs where vs.staff.id = :staffId and vs.active = true")
    List<Long> findActiveVenueIdsByStaffId(@Param("staffId") Long staffId);

    // Nhân viên của một chủ sân: những người có dòng phân công (đang hoạt động hoặc đã gỡ) ở địa điểm của chủ sân đó
    @Query("select distinct vs.staff.id from VenueStaff vs where vs.venue.owner.id = :ownerId")
    List<Long> findStaffIdsByOwnerId(@Param("ownerId") Long ownerId);

    @Query("select distinct vs.staff.id from VenueStaff vs where vs.venue.id = :venueId")
    List<Long> findStaffIdsByVenueId(@Param("venueId") Long venueId);

    @EntityGraph(attributePaths = {"venue"})
    List<VenueStaff> findByStaffIdInAndVenueOwnerId(Collection<Long> staffIds, Long ownerId);

    @EntityGraph(attributePaths = {"venue"})
    List<VenueStaff> findByStaffIdAndVenueOwnerId(Long staffId, Long ownerId);

    boolean existsByStaffIdAndVenueOwnerId(Long staffId, Long ownerId);
}