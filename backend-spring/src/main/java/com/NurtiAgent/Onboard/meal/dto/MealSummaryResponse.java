package com.NurtiAgent.Onboard.meal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealSummaryResponse {

    private ConsumedNutrition consumed;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConsumedNutrition {
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
    }
}
