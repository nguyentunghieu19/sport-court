package com.court.backend.service;

import com.court.backend.entity.FieldPriceRule;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class PricingService {

    // 0 = Chủ nhật, 1 = Thứ hai ... 6 = Thứ bảy
    public int dayIndex(LocalDate date) {
        return date.getDayOfWeek().getValue() % 7;
    }

    // Giá của một ô giờ bắt đầu lúc slotStart: ưu tiên khung đúng thứ, rồi khung mọi ngày, cuối cùng là giá cơ bản
    public BigDecimal priceForSlot(BigDecimal basePrice, List<FieldPriceRule> rules,
                                   LocalDate date, LocalTime slotStart) {
        int day = dayIndex(date);
        FieldPriceRule everyDayRule = null;

        for (FieldPriceRule rule : rules) {
            if (!covers(rule, slotStart)) {
                continue;
            }
            if (rule.getDayOfWeek() == null) {
                everyDayRule = rule;
            } else if (rule.getDayOfWeek() == day) {
                return rule.getPricePerHour();
            }
        }
        return everyDayRule != null ? everyDayRule.getPricePerHour() : basePrice;
    }

    private boolean covers(FieldPriceRule rule, LocalTime slotStart) {
        return !slotStart.isBefore(rule.getStartTime()) && slotStart.isBefore(rule.getEndTime());
    }
}