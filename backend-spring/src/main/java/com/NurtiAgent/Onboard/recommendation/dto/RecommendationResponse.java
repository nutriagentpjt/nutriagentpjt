package com.NurtiAgent.Onboard.recommendation.dto;

import com.NurtiAgent.Onboard.common.enums.MealType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {

    private String setId;
    private String date;
    private MealType mealType;
    private NutritionDto dailyTarget;
    private NutritionDto mealTarget;
    private NutritionDto consumed;
    private NutritionDto gap;
    private List<FoodRecommendationDto> recommendations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NutritionDto {
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FoodRecommendationDto {
        private Integer foodId;
        private String foodName;
        private Double score;
        private ScoreBreakdownDto scoreBreakdown;
        private Double recommendedAmountG;
        private Double amountRatio;
        private NutritionDto nutrientsPerServing;
        private List<String> reasonTags;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScoreBreakdownDto {
        private Double gapMatch;
        private Double goalAlignment;
        private Double diseaseCompliance;
        private Double preference;
        private Double feedback;
    }
}
