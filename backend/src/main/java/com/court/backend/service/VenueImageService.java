package com.court.backend.service;

import com.court.backend.dto.response.VenueResponse;
import com.court.backend.entity.Venue;
import com.court.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class VenueImageService {
    private static final Logger log = LoggerFactory.getLogger(VenueImageService.class);
    private final OwnerAccessService ownerAccessService;
    private final VenueRepository venueRepository;
    private final VenueImageValidator validator;
    private final VenueImageStorage storage;

    @Transactional
    public VenueResponse upload(Long ownerId, Long venueId, MultipartFile file) {
        Venue venue = ownerAccessService.requireOwnedVenueForUpdate(ownerId, venueId);
        var image = validator.validate(file);
        var stored = storage.upload(image.content(), image.format(), venueId);
        String previousId = venue.getImagePublicId();
        // Sau commit xóa ảnh cũ; nếu DB rollback, chỉ xóa ảnh mới vừa upload.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) deleteQuietly(previousId);
                else if (status == STATUS_ROLLED_BACK) deleteQuietly(stored.publicId());
                else log.warn("Không xác định kết quả transaction ảnh địa điểm {}; giữ lại ảnh để đối soát", venueId);
            }
        });
        venue.setImageUrl(stored.url());
        venue.setImagePublicId(stored.publicId());
        return VenueResponse.from(venueRepository.saveAndFlush(venue));
    }

    @Transactional
    public VenueResponse delete(Long ownerId, Long venueId) {
        Venue venue = ownerAccessService.requireOwnedVenueForUpdate(ownerId, venueId);
        String previousId = venue.getImagePublicId();
        if (previousId != null) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { deleteQuietly(previousId); }
            });
        }
        venue.setImageUrl(null);
        venue.setImagePublicId(null);
        return VenueResponse.from(venueRepository.saveAndFlush(venue));
    }

    private void deleteQuietly(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try { storage.delete(publicId); }
        catch (RuntimeException ex) {
            // Không ghi response từ Cloudinary/credentials ra log.
            log.warn("Không dọn được ảnh địa điểm trên Cloudinary (public_id={}); cần thử dọn lại", publicId);
        }
    }
}
