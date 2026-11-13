package com.court.backend.service;

import com.court.backend.entity.Venue;
import com.court.backend.entity.User;
import com.court.backend.enums.VenueStatus;
import com.court.backend.repository.BookingPolicyRepository;
import com.court.backend.repository.SportsFieldRepository;
import com.court.backend.repository.VenueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicVenueImageTest {
    @Mock VenueRepository venues;
    @Mock SportsFieldRepository fields;
    @Mock BookingPolicyRepository policies;
    private PublicCatalogService catalog;
    private Venue venue;

    @BeforeEach
    void setUp() {
        catalog = new PublicCatalogService(venues, fields, policies);
        venue = new Venue();
        venue.setId(7L);
        venue.setName("Cụm sân Xuân Thủy");
        venue.setOwner(new User());
        venue.setStatus(VenueStatus.ACTIVE);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "https://res.cloudinary.com/demo/image/upload/venues/7/cover.jpg")
    void publicSearchReturnsTheVenuePhotoIncludingLegacyVenuesWithoutPhotos(String imageUrl) {
        venue.setImageUrl(imageUrl);
        when(venues.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(venue)));
        var result = catalog.searchVenues(null, null, null, null, 0, 10);
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().getFirst().imageUrl()).isEqualTo(imageUrl);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "https://res.cloudinary.com/demo/image/upload/venues/7/cover.jpg")
    void publicDetailReturnsTheSameVenuePhoto(String imageUrl) {
        venue.setImageUrl(imageUrl);
        when(venues.findById(7L)).thenReturn(Optional.of(venue));
        var result = catalog.getVenueDetail(7L);
        assertThat(result.imageUrl()).isEqualTo(imageUrl);
        assertThat(result.id()).isEqualTo(7L);
    }
}
