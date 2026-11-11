package com.court.backend.service;

import com.court.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

@Component
public class VenueImageValidator {
    public static final long MAX_BYTES = 5 * 1024 * 1024;
    public record ValidatedImage(byte[] content, String format) {}

    public ValidatedImage validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw badImage("Vui lòng chọn một ảnh để tải lên");
        if (file.getSize() > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh tối đa 5 MB");
        try {
            byte[] bytes;
            try (var stream = file.getInputStream()) {
                bytes = stream.readNBytes((int) MAX_BYTES + 1);
            }
            if (bytes.length > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh tối đa 5 MB");
            if (isWebp(bytes)) {
                validateWebp(bytes);
                return new ValidatedImage(bytes, "webp");
            }
            try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw badImage("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP hợp lệ");
                ImageReader reader = readers.next();
                try {
                    String format = reader.getFormatName().toLowerCase();
                    if (!format.equals("jpeg") && !format.equals("png")) throw badImage("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP");
                    reader.setInput(input, true, true);
                    validateDimensions(reader.getWidth(0), reader.getHeight(0));
                    if (reader.read(0) == null) throw badImage("Không đọc được ảnh, vui lòng chọn ảnh khác");
                    return new ValidatedImage(bytes, format.equals("jpeg") ? "jpg" : "png");
                } finally { reader.dispose(); }
            }
        } catch (IOException | IllegalArgumentException ex) {
            throw badImage("Ảnh bị lỗi hoặc không đúng định dạng JPG, PNG, WebP");
        }
    }

    private boolean isWebp(byte[] bytes) {
        return bytes.length >= 20 && tag(bytes, 0).equals("RIFF") && tag(bytes, 8).equals("WEBP");
    }

    // Kiểm tra container và kích thước trước khi gửi; endpoint image của Cloudinary giải mã WebP đầy đủ.
    private void validateWebp(byte[] bytes) {
        if (u32(bytes, 4) != bytes.length - 8L) throw badImage("Ảnh WebP bị lỗi");
        int position = 12;
        boolean dimensionsFound = false;
        while (position + 8 <= bytes.length) {
            String type = tag(bytes, position);
            long size = u32(bytes, position + 4);
            int start = position + 8;
            if (size > bytes.length - start) throw badImage("Ảnh WebP bị lỗi");
            if (type.equals("VP8X") && size >= 10) {
                // Không nhận ảnh động: địa điểm chỉ có một ảnh tĩnh.
                if ((bytes[start] & 2) != 0) throw badImage("Vui lòng chọn ảnh tĩnh");
                validateDimensions(1 + u24(bytes, start + 4), 1 + u24(bytes, start + 7));
                dimensionsFound = true;
            } else if (type.equals("VP8 ") && size >= 10 && (bytes[start + 3] & 255) == 0x9d
                    && (bytes[start + 4] & 255) == 1 && (bytes[start + 5] & 255) == 0x2a) {
                validateDimensions(((bytes[start + 6] & 255) | ((bytes[start + 7] & 255) << 8)) & 0x3fff,
                        ((bytes[start + 8] & 255) | ((bytes[start + 9] & 255) << 8)) & 0x3fff);
                dimensionsFound = true;
            } else if (type.equals("VP8L") && size >= 5 && (bytes[start] & 255) == 0x2f) {
                long bits = u32(bytes, start + 1);
                validateDimensions(1 + (int) (bits & 0x3fff), 1 + (int) ((bits >> 14) & 0x3fff));
                dimensionsFound = true;
            }
            position = (int) (start + size + (size & 1));
        }
        if (!dimensionsFound || position != bytes.length) throw badImage("Ảnh WebP bị lỗi");
    }

    private void validateDimensions(int width, int height) {
        if (width <= 0 || height <= 0 || width > 10000 || height > 10000 || (long) width * height > 20_000_000) {
            throw badImage("Ảnh quá lớn, vui lòng chọn ảnh tối đa 20 megapixel và mỗi chiều tối đa 10.000 pixel");
        }
    }

    private String tag(byte[] bytes, int offset) { return new String(bytes, offset, 4, StandardCharsets.US_ASCII); }
    private int u24(byte[] bytes, int offset) { return (bytes[offset] & 255) | ((bytes[offset + 1] & 255) << 8) | ((bytes[offset + 2] & 255) << 16); }
    private long u32(byte[] bytes, int offset) { return Integer.toUnsignedLong(u24(bytes, offset) | ((bytes[offset + 3] & 255) << 24)); }
    private ApiException badImage(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }
}
