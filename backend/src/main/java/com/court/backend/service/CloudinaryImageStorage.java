package com.court.backend.service;

import com.court.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class CloudinaryImageStorage implements VenueImageStorage {
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final ObjectMapper json;
    private volatile HttpClient client;

    @Autowired
    public CloudinaryImageStorage(ObjectMapper json,
            @Value("${app.cloudinary.cloud-name:${CLOUDINARY_CLOUD_NAME:}}") String cloudName,
            @Value("${app.cloudinary.api-key:${CLOUDINARY_API_KEY:}}") String apiKey,
            @Value("${app.cloudinary.api-secret:${CLOUDINARY_API_SECRET:}}") String apiSecret) {
        this(json, cloudName, apiKey, apiSecret, null);
    }

    CloudinaryImageStorage(ObjectMapper json, String cloudName, String apiKey, String apiSecret, HttpClient client) {
        this.json = json;
        this.cloudName = cloudName.trim();
        this.apiKey = apiKey.trim();
        this.apiSecret = apiSecret.trim();
        this.client = client;
    }

    @Override
    public StoredImage upload(byte[] content, String format, Long venueId) {
        requireConfiguration();
        String publicId = "sportcourt/venues/" + venueId + "/" + UUID.randomUUID();
        Map<String, String> params = new TreeMap<>();
        params.put("timestamp", Long.toString(Instant.now().getEpochSecond()));
        params.put("public_id", publicId);
        params.put("overwrite", "false");
        params.put("allowed_formats", "jpg,png,webp");
        authenticate(params);
        String boundary = "SportCourt" + UUID.randomUUID().toString().replace("-", "");
        byte[] body = multipart(params, content, format, boundary);
        HttpRequest request = HttpRequest.newBuilder(endpoint("upload")).timeout(Duration.ofSeconds(30))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body)).build();
        try {
            HttpResponse<String> response = send(request);
            if (response.statusCode() == 400) throw new ApiException(HttpStatus.BAD_REQUEST, "Cloudinary không đọc được ảnh. Vui lòng chọn ảnh JPG, PNG hoặc WebP khác");
            if (response.statusCode() / 100 != 2) throw remoteFailure();
            var result = json.readTree(response.body());
            String url = result.path("secure_url").asString("");
            String returnedId = result.path("public_id").asString("");
            if (!returnedId.equals(publicId) || !url.startsWith("https://")
                    || !result.path("resource_type").asString("").equals("image")
                    || !java.util.Set.of("jpg", "png", "webp").contains(result.path("format").asString(""))) {
                throw remoteFailure();
            }
            return new StoredImage(url, returnedId);
        } catch (RuntimeException ex) {
            // Public ID được server tạo trước khi gửi; dọn nếu Cloudinary đã nhận file nhưng response lỗi.
            try { delete(publicId); } catch (RuntimeException ignored) { /* xem giới hạn dọn ảnh trong docs */ }
            if (ex instanceof ApiException api) throw api;
            throw remoteFailure();
        }
    }

    @Override
    public void delete(String publicId) {
        requireConfiguration();
        Map<String, String> params = new TreeMap<>();
        params.put("public_id", publicId);
        params.put("timestamp", Long.toString(Instant.now().getEpochSecond()));
        params.put("invalidate", "true");
        authenticate(params);
        String body = params.entrySet().stream().map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
        HttpRequest request = HttpRequest.newBuilder(endpoint("destroy")).timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = send(request);
        if (response.statusCode() / 100 != 2) throw remoteFailure();
        String result = json.readTree(response.body()).path("result").asString("");
        if (!result.equals("ok") && !result.equals("not found")) throw remoteFailure();
    }

    private HttpResponse<String> send(HttpRequest request) {
        try { return httpClient().send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)); }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw remoteFailure();
        } catch (IOException | java.io.UncheckedIOException ex) { throw remoteFailure(); }
    }

    // Chỉ tạo transport khi có request ảnh thật; thiếu khóa không cần tài nguyên mạng lúc startup.
    private HttpClient httpClient() {
        HttpClient current = client;
        if (current != null) return current;
        synchronized (this) {
            if (client == null) {
                client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
                        .followRedirects(HttpClient.Redirect.NEVER).build();
            }
            return client;
        }
    }

    private URI endpoint(String operation) {
        return URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/" + operation);
    }

    private void requireConfiguration() {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Chức năng tải ảnh chưa được cấu hình Cloudinary. Vui lòng liên hệ quản trị viên");
        }
        if (!cloudName.matches("[a-zA-Z0-9_-]+")) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Cấu hình Cloudinary không hợp lệ");
        }
    }

    private void authenticate(Map<String, String> params) {
        params.put("signature", signature(params, apiSecret));
        params.put("api_key", apiKey);
    }

    static String signature(Map<String, String> params, String secret) {
        String message = new TreeMap<>(params).entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue()).collect(Collectors.joining("&")) + secret;
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest(message.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }

    private byte[] multipart(Map<String, String> params, byte[] content, String format, String boundary) {
        var output = new ByteArrayOutputStream();
        params.forEach((key, value) -> output.writeBytes(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + key + "\"\r\n\r\n" + value + "\r\n").getBytes(StandardCharsets.UTF_8)));
        output.writeBytes(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"venue." + format
                + "\"\r\nContent-Type: image/" + (format.equals("jpg") ? "jpeg" : format) + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.writeBytes(content);
        output.writeBytes(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return output.toByteArray();
    }

    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private ApiException remoteFailure() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "Không kết nối được dịch vụ ảnh Cloudinary hoặc cấu hình chưa đúng. Vui lòng thử lại sau");
    }
}
