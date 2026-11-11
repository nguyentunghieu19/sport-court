package com.court.backend.service;

import com.court.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

import java.io.ByteArrayOutputStream;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CloudinaryImageStorageTest {
    private final HttpClient client = mock(HttpClient.class);
    private final CloudinaryImageStorage storage = new CloudinaryImageStorage(JsonMapper.builder().build(),"test-cloud","test-key","test-secret",client);

    @Test void sendsSignedMultipartWithBinaryFileAndServerGeneratedPublicId() throws Exception {
        List<HttpRequest> requests = new ArrayList<>();
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenAnswer(invocation -> {
            HttpRequest request = invocation.getArgument(0); requests.add(request);
            Map<String,String> params = multipartFields(body(request));
            String id = params.get("public_id");
            return response(200,"{\"secure_url\":\"https://res.cloudinary.com/test-cloud/image/upload/v1/venue.png\",\"public_id\":\"" + id + "\",\"format\":\"png\",\"resource_type\":\"image\"}");
        });
        var image = VenueImageServiceTest.image();
        var result = storage.upload(image.getBytes(), "png", 7L);
        HttpRequest request = requests.getFirst();
        assertThat(request.uri().toString()).isEqualTo("https://api.cloudinary.com/v1_1/test-cloud/image/upload");
        String body = body(request);
        Map<String,String> fields = multipartFields(body);
        String signature = fields.remove("signature");
        assertThat(fields.remove("api_key")).isEqualTo("test-key");
        assertThat(signature).isEqualTo(CloudinaryImageStorage.signature(fields,"test-secret"));
        assertThat(fields).containsEntry("allowed_formats","jpg,png,webp").containsEntry("overwrite","false");
        assertThat(result.publicId()).startsWith("sportcourt/venues/7/");
        assertThat(body).contains("name=\"file\"; filename=\"venue.png\"").contains("Content-Type: image/png");
        assertThat(body.getBytes(StandardCharsets.ISO_8859_1)).containsSubsequence(image.getBytes());
        assertThat(body).doesNotContain("test-secret");
    }

    @Test void destroySignsInvalidateAndPublicId() throws Exception {
        List<HttpRequest> requests = new ArrayList<>();
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenAnswer(invocation -> {
            requests.add(invocation.getArgument(0)); return response(200,"{\"result\":\"ok\"}");
        });
        storage.delete("sportcourt/venues/7/test");
        var request = requests.getFirst();
        Map<String,String> fields = new TreeMap<>();
        for (String pair : body(request).split("&")) {
            String[] item = pair.split("=",2);
            fields.put(URLDecoder.decode(item[0],StandardCharsets.UTF_8),URLDecoder.decode(item[1],StandardCharsets.UTF_8));
        }
        String signature = fields.remove("signature"); fields.remove("api_key");
        assertThat(fields).containsEntry("invalidate","true").containsEntry("public_id","sportcourt/venues/7/test");
        assertThat(signature).isEqualTo(CloudinaryImageStorage.signature(fields,"test-secret"));
        assertThat(request.uri().getPath()).endsWith("/image/destroy");
    }

    @Test void missingKeysAreReportedWithoutAnyNetworkCall() {
        var unconfigured = new CloudinaryImageStorage(JsonMapper.builder().build(),"","","",client);
        assertThatThrownBy(() -> unconfigured.upload(new byte[]{1},"png",7L))
                .isInstanceOfSatisfying(ApiException.class, ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        verifyNoInteractions(client);
    }

    @Test void defaultConstructorDoesNotInitializeNetworkingWhenCredentialsAreMissing() {
        var unconfigured = new CloudinaryImageStorage(JsonMapper.builder().build(), "", "", "");
        assertThatThrownBy(() -> unconfigured.upload(new byte[]{1}, "png", 7L))
                .isInstanceOfSatisfying(ApiException.class, ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test void upstreamFailureDoesNotExposeItsResponseOrSecret() throws Exception {
        var failure = response(401,"test-secret internal-provider-error");
        var deleted = response(200,"{\"result\":\"not found\"}");
        when(client.send(any(), any(HttpResponse.BodyHandler.class)))
                .thenReturn(failure, deleted);
        assertThatThrownBy(() -> storage.upload(new byte[]{1},"png",7L))
                .isInstanceOf(ApiException.class).hasMessageNotContaining("test-secret").hasMessageNotContaining("internal-provider-error");
        verify(client,times(2)).send(any(),any());
    }

    @Test void malformedSuccessResponseTriggersCleanup() throws Exception {
        var malformed = response(200,"not-json");
        var deleted = response(200,"{\"result\":\"ok\"}");
        when(client.send(any(), any(HttpResponse.BodyHandler.class)))
                .thenReturn(malformed, deleted);
        assertThatThrownBy(() -> storage.upload(new byte[]{1},"png",7L)).isInstanceOf(ApiException.class);
        verify(client,times(2)).send(any(),any());
    }

    @Test void insecureImageUrlIsNeverAccepted() throws Exception {
        when(client.send(any(), any(HttpResponse.BodyHandler.class))).thenAnswer(invocation -> {
            HttpRequest request = invocation.getArgument(0);
            if (request.uri().getPath().endsWith("/destroy")) return response(200,"{\"result\":\"ok\"}");
            String id = multipartFields(body(request)).get("public_id");
            return response(200,"{\"secure_url\":\"http://example.test/x.png\",\"public_id\":\"" + id + "\",\"format\":\"png\",\"resource_type\":\"image\"}");
        });
        assertThatThrownBy(() -> storage.upload(new byte[]{1},"png",7L)).isInstanceOf(ApiException.class);
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status); when(response.body()).thenReturn(body); return response;
    }

    private Map<String,String> multipartFields(String body) {
        Map<String,String> fields = new TreeMap<>();
        var matcher = Pattern.compile("name=\"([^\"]+)\"\\r\\n\\r\\n([^\\r]+)\\r\\n").matcher(body);
        while (matcher.find()) fields.put(matcher.group(1),matcher.group(2));
        return fields;
    }

    private String body(HttpRequest request) throws Exception {
        var bytes = new ByteArrayOutputStream();
        var done = new CompletableFuture<Void>();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            public void onSubscribe(Flow.Subscription subscription) { subscription.request(Long.MAX_VALUE); }
            public void onNext(ByteBuffer buffer) { byte[] chunk = new byte[buffer.remaining()]; buffer.get(chunk); bytes.writeBytes(chunk); }
            public void onError(Throwable error) { done.completeExceptionally(error); }
            public void onComplete() { done.complete(null); }
        });
        done.get(); return bytes.toString(StandardCharsets.ISO_8859_1);
    }
}
