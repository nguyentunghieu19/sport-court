package com.court.backend.service;

import com.court.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import static org.assertj.core.api.Assertions.*;

class VenueImageValidatorTest {
    private final VenueImageValidator validator = new VenueImageValidator();

    @Test void detectsActualImageRatherThanClientExtensionOrMime() throws Exception {
        var image = VenueImageServiceTest.image();
        var disguised = new MockMultipartFile("file", "wrong.jpg", "application/octet-stream", image.getBytes());
        assertThat(validator.validate(disguised).format()).isEqualTo("png");
    }

    @Test void acceptsJpeg() throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(5, 5, BufferedImage.TYPE_INT_RGB), "jpg", bytes);
        assertThat(validator.validate(new MockMultipartFile("file","x.jpg","image/jpeg",bytes.toByteArray())).format()).isEqualTo("jpg");
    }

    @Test void rejectsFakeImage() {
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("file","x.png","image/png","<script>evil</script>".getBytes())))
                .isInstanceOf(ApiException.class);
    }

    @Test void rejectsEmptyFile() {
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("file",new byte[0]))).isInstanceOf(ApiException.class);
    }

    @Test void rejectsOversizedFile() {
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("file",new byte[5 * 1024 * 1024 + 1])))
                .isInstanceOfSatisfying(ApiException.class, ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
    }

    @Test void rejectsMalformedWebpChunk() {
        byte[] bytes = new byte[30];
        System.arraycopy("RIFF".getBytes(),0,bytes,0,4); bytes[4]=22;
        System.arraycopy("WEBPVP8X".getBytes(),0,bytes,8,8); bytes[16]=100;
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("file",bytes))).isInstanceOf(ApiException.class);
    }

    @Test void rejectsTruncatedPng() throws Exception {
        byte[] png = VenueImageServiceTest.image().getBytes();
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("file",java.util.Arrays.copyOf(png, 40))))
                .isInstanceOf(ApiException.class);
    }
}
