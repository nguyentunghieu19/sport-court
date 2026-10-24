package com.court.backend.repository;

import com.court.backend.entity.FieldPriceRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FieldPriceRuleRepository extends JpaRepository<FieldPriceRule, Long> {

    List<FieldPriceRule> findByFieldIdOrderByDayOfWeekAscStartTimeAsc(Long fieldId);

    List<FieldPriceRule> findByFieldIdAndActiveTrue(Long fieldId);

    Optional<FieldPriceRule> findByIdAndFieldId(Long id, Long fieldId);
}