package com.court.backend.service;

import com.court.backend.config.AppTime;
import com.court.backend.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

// Tạo đường dẫn thanh toán và kiểm tra chữ ký của VNPay (HMAC-SHA512)
@Service
public class VnpayService {

    private static final DateTimeFormatter VNPAY_DATE =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(AppTime.ZONE);

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;

    public VnpayService(@Value("${app.vnpay.tmn-code:}") String tmnCode,
                        @Value("${app.vnpay.hash-secret:}") String hashSecret,
                        @Value("${app.vnpay.pay-url:}") String payUrl,
                        @Value("${app.vnpay.return-url:}") String returnUrl) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
    }

    public String buildPaymentUrl(Long paymentId, String bookingCode, BigDecimal amount,
                                  String ipAddress, Instant expireAt) {
        ensureConfigured();

        TreeMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        // VNPay yêu cầu số tiền nhân 100
        params.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP).toPlainString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", String.valueOf(paymentId));
        params.put("vnp_OrderInfo", "Thanh toan don dat san " + bookingCode);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", normalizeIp(ipAddress));
        params.put("vnp_CreateDate", VNPAY_DATE.format(Instant.now()));
        params.put("vnp_ExpireDate", VNPAY_DATE.format(expireAt));

        String hashData = buildHashData(params);
        String secureHash = hmacSha512(hashData);
        return payUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    // Kiểm tra dữ liệu VNPay gửi về có đúng chữ ký không
    public boolean verifySignature(Map<String, String> params) {
        ensureConfigured();

        String received = params.get("vnp_SecureHash");
        if (received == null || received.isBlank()) {
            return false;
        }

        TreeMap<String, String> sorted = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                sorted.put(key, entry.getValue());
            }
        }

        String expected = hmacSha512(buildHashData(sorted));
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                received.toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    private String buildHashData(Map<String, String> sortedParams) {
        return sortedParams.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isEmpty())
                .map(entry -> entry.getKey() + "="
                        + URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
    }

    private String hmacSha512(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(hashSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không tạo được chữ ký HMAC-SHA512", e);
        }
    }

    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank() || ip.contains(":")) {
            return "127.0.0.1";
        }
        return ip;
    }

    private void ensureConfigured() {
        if (tmnCode.isBlank() || hashSecret.isBlank() || payUrl.isBlank() || returnUrl.isBlank()
                || tmnCode.contains("CUA_BAN") || hashSecret.contains("CUA_BAN")) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình VNPay (app.vnpay.* trong application.properties)");
        }
    }
}