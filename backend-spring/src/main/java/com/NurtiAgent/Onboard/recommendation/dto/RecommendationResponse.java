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
    private SummaryDto summary;
    private NutritionGapDto gap;
    private List<FoodRecommendationDto> recommendations;
    private String coachText;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryDto {
        private NutritionDto consumed;
        private NutritionDto target;
    }

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
    public static class NutritionGapDto {
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
        private String foodName;
        private Double recommendedAmount;
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
        private Double score;
        private List<String> reasons;
    }
}
