package com.court.backend.controller;

import com.court.backend.config.SecurityConfig;
import com.court.backend.dto.response.VenueResponse;
import com.court.backend.entity.User;
import com.court.backend.entity.Venue;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.GlobalExceptionHandler;
import com.court.backend.service.JwtService;
import com.court.backend.service.VenueImageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = OwnerVenueImageController.class, properties = {
        "app.jwt.secret=venue-image-test-only-secret-more-than-32-characters",
        "app.jwt.expiration-minutes=60"
})
@ContextConfiguration(classes = {OwnerVenueImageController.class, SecurityConfig.class,
        JwtService.class, GlobalExceptionHandler.class})
class OwnerVenueImageControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean VenueImageService images;

    @Test void anonymousCannotUploadOrDelete() throws Exception {
        mvc.perform(multipart("/api/owner/venues/7/image").file(file())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/owner/venues/7/image")).andExpect(status().isUnauthorized());
        verifyNoInteractions(images);
    }

    @ParameterizedTest
    @EnumSource(value = UserRole.class, names = {"USER", "STAFF"})
    void onlyOwnersCanManageVenueImages(UserRole role) throws Exception {
        mvc.perform(multipart("/api/owner/venues/7/image").file(file()).header("Authorization", token(role)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/owner/venues/7/image").header("Authorization", token(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(images);
    }

    @Test void uploadUsesAuthenticatedOwnerAndReturnsPhotoWithoutCloudPublicId() throws Exception {
        when(images.upload(eq(1L), eq(7L), any())).thenReturn(response("https://example.test/cover.png"));
        mvc.perform(multipart("/api/owner/venues/7/image").file(file()).header("Authorization", token(UserRole.OWNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("imageUrl").value("https://example.test/cover.png"))
                .andExpect(jsonPath("imagePublicId").doesNotExist());
        verify(images).upload(eq(1L), eq(7L), any());
    }

    @Test void missingFileReturnsActionableValidationError() throws Exception {
        mvc.perform(multipart("/api/owner/venues/7/image").header("Authorization", token(UserRole.OWNER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("message").value("Vui lòng chọn một ảnh để tải lên"));
        verifyNoInteractions(images);
    }

    @Test void deleteReturnsVenueWithEmptyPhoto() throws Exception {
        when(images.delete(1L, 7L)).thenReturn(response(null));
        mvc.perform(delete("/api/owner/venues/7/image").header("Authorization", token(UserRole.OWNER)))
                .andExpect(status().isOk()).andExpect(jsonPath("imageUrl").isEmpty());
        verify(images).delete(1L, 7L);
    }

    private MockMultipartFile file() {
        return new MockMultipartFile("file", "cover.png", "image/png", new byte[]{1, 2, 3});
    }

    private String token(UserRole role) {
        User user = new User(); user.setId(1L); user.setRole(role);
        return "Bearer " + jwt.generateToken(user);
    }

    private VenueResponse response(String url) {
        User owner = new User(); owner.setId(1L);
        Venue venue = new Venue(); venue.setId(7L); venue.setOwner(owner);
        venue.setImageUrl(url); venue.setImagePublicId("private-cloud-id");
        return VenueResponse.from(venue);
    }
}
