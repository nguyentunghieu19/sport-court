package com.court.backend.service;

import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.PolicyResponse;
import com.court.backend.dto.response.PublicFieldResponse;
import com.court.backend.dto.response.SportTypeResponse;
import com.court.backend.dto.response.VenueDetailResponse;
import com.court.backend.dto.response.VenueSummaryResponse;
import com.court.backend.entity.SportsField;
import com.court.backend.entity.Venue;
import com.court.backend.enums.FieldStatus;
import com.court.backend.enums.SportType;
import com.court.backend.enums.VenueStatus;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.BookingPolicyRepository;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.VenueRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicCatalogService {

    private static final int MAX_PAGE_SIZE = 50;

    private final VenueRepository venueRepository;
    private final SportsFieldRepository sportsFieldRepository;
    private final BookingPolicyRepository bookingPolicyRepository;

    public List<SportTypeResponse> listSportTypes() {
        return Arrays.stream(SportType.values())
                .map(type -> new SportTypeResponse(type.name(), type.getLabel()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<VenueSummaryResponse> searchVenues(String city, String district, String keyword,
                                                           SportType sportType, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        Page<Venue> venues = venueRepository.findAll(
                buildSpecification(city, district, keyword, sportType),
                PageRequest.of(safePage, safeSize, Sort.by("name").ascending().and(Sort.by("id").ascending())));

        List<Long> venueIds = venues.getContent().stream().map(Venue::getId).toList();
        Map<Long, List<SportsField>> fieldsByVenue = venueIds.isEmpty()
                ? Map.of()
                : sportsFieldRepository.findByVenueIdInAndStatus(venueIds, FieldStatus.ACTIVE).stream()
                .collect(Collectors.groupingBy(field -> field.getVenue().getId()));

        return PageResponse.from(venues.map(venue ->
                toSummary(venue, fieldsByVenue.getOrDefault(venue.getId(), List.of()))));
    }

    @Transactional(readOnly = true)
    public VenueDetailResponse getVenueDetail(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .filter(v -> v.getStatus() == VenueStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm"));

        List<PublicFieldResponse> fields = sportsFieldRepository
                .findByVenueIdAndStatusInOrderByNameAsc(venueId, List.of(FieldStatus.ACTIVE, FieldStatus.MAINTENANCE))
                .stream()
                .map(PublicFieldResponse::from)
                .toList();

        PolicyResponse policy = bookingPolicyRepository.findByVenueId(venueId)
                .map(PolicyResponse::from)
                .orElse(null);

        return new VenueDetailResponse(
                venue.getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getDistrict(),
                venue.getDescription(),
                venue.getPhone(),
                venue.getOpeningTime(),
                venue.getClosingTime(),
                policy,
                fields);
    }

    private VenueSummaryResponse toSummary(Venue venue, List<SportsField> activeFields) {
        List<String> sportTypes = activeFields.stream()
                .map(SportsField::getSportType)
                .distinct()
                .sorted()
                .toList();
        BigDecimal minBasePrice = activeFields.stream()
                .map(SportsField::getBasePrice)
                .min(Comparator.naturalOrder())
                .orElse(null);

        return new VenueSummaryResponse(
                venue.getId(),
                venue.getName(),
                venue.getAddress(),
                venue.getCity(),
                venue.getDistrict(),
                venue.getPhone(),
                venue.getOpeningTime(),
                venue.getClosingTime(),
                sportTypes,
                activeFields.size(),
                minBasePrice);
    }

    // Chỉ thêm điều kiện lọc khi người dùng có truyền giá trị
    private Specification<Venue> buildSpecification(String city, String district, String keyword,
                                                    SportType sportType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), VenueStatus.ACTIVE));

            if (hasText(city)) {
                predicates.add(cb.equal(cb.lower(root.<String>get("city")), city.trim().toLowerCase()));
            }
            if (hasText(district)) {
                predicates.add(cb.equal(cb.lower(root.<String>get("district")), district.trim().toLowerCase()));
            }
            if (hasText(keyword)) {
                String pattern = "%" + escapeLike(keyword.trim().toLowerCase()) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("name")), pattern, '\\'),
                        cb.like(cb.lower(root.<String>get("address")), pattern, '\\')));
            }
            if (sportType != null && query != null) {
                Subquery<Integer> subquery = query.subquery(Integer.class);
                Root<SportsField> field = subquery.from(SportsField.class);
                subquery.select(cb.literal(1)).where(
                        cb.equal(field.get("venue").get("id"), root.get("id")),
                        cb.equal(field.get("status"), FieldStatus.ACTIVE),
                        cb.equal(field.get("sportType"), sportType.name()));
                predicates.add(cb.exists(subquery));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}