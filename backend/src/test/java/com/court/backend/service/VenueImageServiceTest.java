package com.court.backend.service;

import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.VenueRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VenueImageServiceTest {
    private OwnerAccessService access;
    private VenueRepository venues;
    private VenueImageStorage cloud;
    private VenueImageService service;
    private Venue venue;

    @BeforeEach void setUp() {
        access = mock(OwnerAccessService.class);
        venues = mock(VenueRepository.class);
        cloud = mock(VenueImageStorage.class);
        service = new VenueImageService(access, venues, new VenueImageValidator(), cloud);
        User owner = new User(); owner.setId(1L);
        venue = new Venue(); venue.setId(7L); venue.setOwner(owner);
        venue.setImageUrl("https://example.test/old.png"); venue.setImagePublicId("old");
        when(access.requireOwnedVenueForUpdate(1L, 7L)).thenReturn(venue);
        when(venues.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach void tearDown() { TransactionSynchronizationManager.clearSynchronization(); }

    @Test void replacesOnlyAfterCommitAndKeepsPublicIdOutOfResponse() throws Exception {
        when(cloud.upload(any(), eq("png"), eq(7L))).thenReturn(new VenueImageStorage.StoredImage("https://example.test/new.png", "new"));
        var result = service.upload(1L, 7L, image());
        assertThat(result.imageUrl()).isEqualTo("https://example.test/new.png");
        verify(cloud, never()).delete(any());
        complete(TransactionSynchronization.STATUS_COMMITTED);
        verify(cloud).delete("old"); verify(cloud, never()).delete("new");
    }

    @Test void rollbackDeletesNewImageButPreservesOldCloudAsset() throws Exception {
        when(cloud.upload(any(), anyString(), eq(7L))).thenReturn(new VenueImageStorage.StoredImage("https://example.test/new.png", "new"));
        service.upload(1L, 7L, image());
        complete(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(cloud).delete("new"); verify(cloud, never()).delete("old");
    }

    @Test void databaseFailureStillRegistersRollbackCleanup() throws Exception {
        when(cloud.upload(any(), anyString(), eq(7L))).thenReturn(new VenueImageStorage.StoredImage("https://example.test/new.png", "new"));
        when(venues.saveAndFlush(any())).thenThrow(new IllegalStateException("database unavailable"));
        assertThatThrownBy(() -> service.upload(1L, 7L, image())).isInstanceOf(IllegalStateException.class);
        complete(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(cloud).delete("new"); verify(cloud, never()).delete("old");
    }

    @Test void unknownCommitOutcomeNeverDeletesAnImageThatMightBeInUse() throws Exception {
        when(cloud.upload(any(), anyString(), eq(7L))).thenReturn(new VenueImageStorage.StoredImage("https://example.test/new.png", "new"));
        service.upload(1L, 7L, image());
        complete(TransactionSynchronization.STATUS_UNKNOWN);
        verify(cloud, never()).delete(any());
    }

    @Test void unauthorizedVenueNeverUploadsAnything() throws Exception {
        when(access.requireOwnedVenueForUpdate(1L, 7L)).thenThrow(new ApiException(HttpStatus.NOT_FOUND,"Không tìm thấy địa điểm"));
        assertThatThrownBy(() -> service.upload(1L, 7L, image())).isInstanceOf(ApiException.class);
        verifyNoInteractions(cloud);
    }

    @Test void cloudUploadFailureDoesNotChangeSavedImage() throws Exception {
        when(cloud.upload(any(), anyString(), eq(7L))).thenThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa cấu hình"));
        assertThatThrownBy(() -> service.upload(1L, 7L, image())).isInstanceOf(ApiException.class);
        assertThat(venue.getImagePublicId()).isEqualTo("old"); verify(venues, never()).saveAndFlush(any());
    }

    @Test void deletesOnlyAfterSuccessfulDatabaseCommit() {
        assertThat(service.delete(1L, 7L).imageUrl()).isNull();
        verifyNoInteractions(cloud);
        var sync = TransactionSynchronizationManager.getSynchronizations().getFirst();
        sync.afterCommit();
        verify(cloud).delete("old");
    }

    @Test void deleteRollbackPreservesCloudAsset() {
        service.delete(1L, 7L);
        complete(TransactionSynchronization.STATUS_ROLLED_BACK);
        verifyNoInteractions(cloud);
    }

    @Test void cleanupFailureDoesNotTurnCommittedUpdateIntoAnError() throws Exception {
        when(cloud.upload(any(), anyString(), eq(7L))).thenReturn(new VenueImageStorage.StoredImage("https://example.test/new.png", "new"));
        doThrow(new RuntimeException()).when(cloud).delete("old");
        service.upload(1L, 7L, image());
        assertThatCode(() -> complete(TransactionSynchronization.STATUS_COMMITTED)).doesNotThrowAnyException();
    }

    private void complete(int status) {
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(status));
    }

    static MockMultipartFile image() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("file", "picture.png", "image/png", bytes.toByteArray());
    }
}
