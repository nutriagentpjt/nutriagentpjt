package com.NurtiAgent.Onboard.preference.dto;

import com.NurtiAgent.Onboard.common.enums.DietStyle;
import com.NurtiAgent.Onboard.common.enums.MealPattern;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceUpdateRequest {

    // 식사 패턴 (optional)
    private MealPattern mealPattern;

    // 알레르기 식품 리스트 (optional, 전체 교체)
    private List<String> allergies;

    // 식단 스타일 (optional, 전체 교체)
    private List<DietStyle> dietStyles;

    // 물 섭취 목표 (optional, 리터)
    @Min(value = 0, message = "물 섭취 목표는 0 이상이어야 합니다")
    @Max(value = 10, message = "물 섭취 목표는 10L 이하여야 합니다")
    private Double waterIntakeGoal;

    // 추가 제약 조건 (optional)
    private DietaryConstraintsDto constraints;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DietaryConstraintsDto {
        private Boolean lowSodium;
        private Boolean lowSugar;

        @Min(value = 0, message = "최대 칼로리는 0 이상이어야 합니다")
        private Integer maxCaloriesPerMeal;
    }
}
