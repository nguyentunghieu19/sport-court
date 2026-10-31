package com.court.backend.controller;

import com.court.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/payments/vnpay")
@RequiredArgsConstructor
public class VnpayCallbackController {

    private final PaymentService paymentService;

    // Return URL: trình duyệt của khách được VNPay chuyển về đây sau khi thanh toán
    @GetMapping(value = "/return", produces = "text/html;charset=UTF-8")
    public String returnPage(@RequestParam Map<String, String> params) {
        PaymentService.ProcessResult result = paymentService.processVnpayResult(params);

        String title;
        String message;
        if (result.paid()) {
            title = "Thanh toán thành công";
            message = "Đơn " + result.bookingCode()
                    + " đã được xác nhận. Bạn có thể đóng trang này và quay lại ứng dụng.";
        } else if ("97".equals(result.rspCode())) {
            title = "Dữ liệu không hợp lệ";
            message = "Không xác thực được kết quả thanh toán.";
        } else {
            title = "Thanh toán chưa thành công";
            message = "Giao dịch bị hủy hoặc thất bại. Bạn có thể quay lại ứng dụng và thử thanh toán lại.";
        }

        return "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
                + "<title>" + title + "</title></head>"
                + "<body style=\"font-family:sans-serif;text-align:center;padding:48px 16px\">"
                + "<h2>" + title + "</h2><p>" + message + "</p></body></html>";
    }

    // IPN: VNPay gọi thẳng vào máy chủ (cần địa chỉ công khai); phải trả JSON đúng mẫu
    @GetMapping("/ipn")
    public Map<String, String> ipn(@RequestParam Map<String, String> params) {
        PaymentService.ProcessResult result = paymentService.processVnpayResult(params);
        return Map.of("RspCode", result.rspCode(), "Message", result.message());
    }
}