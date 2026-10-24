package com.court.backend.config;

import java.time.ZoneId;

// Múi giờ dùng chung cho toàn hệ thống
public final class AppTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private AppTime() {
    }
}
