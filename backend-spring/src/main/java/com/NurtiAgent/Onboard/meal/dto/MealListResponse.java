package com.NurtiAgent.Onboard.meal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealListResponse {

    private String date;
    private NutritionSummary summary;
    private List<MealItemResponse> meals;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NutritionSummary {
        private Double totalCalories;
        private Double totalProtein;
        private Double totalCarbs;
        private Double totalFat;

        // 온보딩 완료 시 추가 필드
        private Double targetCalories;
        private Double targetProtein;
        private Double targetCarbs;
        private Double targetFat;

        private Double caloriesAchievement;
        private Double proteinAchievement;
        private Double carbsAchievement;
        private Double fatAchievement;
    }
}
