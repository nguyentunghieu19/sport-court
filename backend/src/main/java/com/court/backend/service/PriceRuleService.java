package com.court.backend.service;

import com.court.backend.dto.request.PriceRuleRequest;
import com.court.backend.dto.response.PriceRuleResponse;
import com.court.backend.entity.FieldPriceRule;
import com.court.backend.entity.SportsField;
import com.court.backend.exception.ApiException;
import com.court.backend.repository.FieldPriceRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PriceRuleService {

    private final FieldPriceRuleRepository priceRuleRepository;
    private final OwnerAccessService ownerAccessService;

    @Transactional
    public PriceRuleResponse create(Long ownerId, Long venueId, Long fieldId, PriceRuleRequest request) {
        SportsField field = ownerAccessService.requireOwnedField(ownerId, venueId, fieldId);
        validate(request);

        boolean active = isActive(request);
        if (active) {
            checkOverlap(fieldId, request, null);
        }

        FieldPriceRule rule = new FieldPriceRule();
        rule.setField(field);
        apply(rule, request, active);
        return PriceRuleResponse.from(priceRuleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public List<PriceRuleResponse> list(Long ownerId, Long venueId, Long fieldId) {
        ownerAccessService.requireOwnedField(ownerId, venueId, fieldId);
        return priceRuleRepository.findByFieldIdOrderByDayOfWeekAscStartTimeAsc(fieldId).stream()
                .map(PriceRuleResponse::from)
                .toList();
    }

    @Transactional
    public PriceRuleResponse update(Long ownerId, Long venueId, Long fieldId, Long ruleId,
                                    PriceRuleRequest request) {
        ownerAccessService.requireOwnedField(ownerId, venueId, fieldId);
        FieldPriceRule rule = findRule(fieldId, ruleId);
        validate(request);

        boolean active = isActive(request);
        if (active) {
            checkOverlap(fieldId, request, ruleId);
        }

        apply(rule, request, active);
        return PriceRuleResponse.from(priceRuleRepository.save(rule));
    }

    @Transactional
    public void delete(Long ownerId, Long venueId, Long fieldId, Long ruleId) {
        ownerAccessService.requireOwnedField(ownerId, venueId, fieldId);
        priceRuleRepository.delete(findRule(fieldId, ruleId));
    }

    private FieldPriceRule findRule(Long fieldId, Long ruleId) {
        return priceRuleRepository.findByIdAndFieldId(ruleId, fieldId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khung giá"));
    }

    private boolean isActive(PriceRuleRequest request) {
        return request.active() == null || request.active();
    }

    private void validate(PriceRuleRequest request) {
        if (!isWholeHour(request.startTime()) || !isWholeHour(request.endTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Khung giờ phải là giờ chẵn (ví dụ 17:00)");
        }
        if (!request.startTime().isBefore(request.endTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Giờ bắt đầu phải trước giờ kết thúc");
        }
    }

    private boolean isWholeHour(LocalTime time) {
        return time.getMinute() == 0 && time.getSecond() == 0 && time.getNano() == 0;
    }

    // Hai khung giá đang hoạt động, cùng phạm vi ngày, không được chồng giờ lên nhau
    private void checkOverlap(Long fieldId, PriceRuleRequest request, Long excludeRuleId) {
        for (FieldPriceRule other : priceRuleRepository.findByFieldIdAndActiveTrue(fieldId)) {
            if (excludeRuleId != null && other.getId().equals(excludeRuleId)) {
                continue;
            }
            boolean sameScope = Objects.equals(other.getDayOfWeek(), request.dayOfWeek());
            boolean overlap = request.startTime().isBefore(other.getEndTime())
                    && request.endTime().isAfter(other.getStartTime());
            if (sameScope && overlap) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Khung giờ bị trùng với một khung giá khác của cùng ngày");
            }
        }
    }

    private void apply(FieldPriceRule rule, PriceRuleRequest request, boolean active) {
        rule.setDayOfWeek(request.dayOfWeek());
        rule.setStartTime(request.startTime());
        rule.setEndTime(request.endTime());
        rule.setPricePerHour(request.pricePerHour());
        rule.setActive(active);
    }
}