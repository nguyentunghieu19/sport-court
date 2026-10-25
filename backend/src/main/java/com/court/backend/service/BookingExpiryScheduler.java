package com.court.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private final BookingService bookingService;

    // Cứ 30 giây quét một lần và hủy các đơn quá hạn thanh toán
    @Scheduled(initialDelay = 30_000, fixedDelay = 30_000)
    public void releaseExpiredBookings() {
        int released = bookingService.releaseExpiredBookings();
        if (released > 0) {
            log.info("Đã tự hủy {} đơn đặt sân quá hạn thanh toán", released);
        }
    }
}
