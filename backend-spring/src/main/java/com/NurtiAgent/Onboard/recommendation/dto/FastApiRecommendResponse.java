package com.NurtiAgent.Onboard.recommendation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class FastApiRecommendResponse {

    @JsonProperty("meal_type")
    private String mealType;

    @JsonProperty("daily_target")
    private NutrientTargets dailyTarget;

    @JsonProperty("meal_target")
    private NutrientTargets mealTarget;

    private List<FoodRecommendation> recommendations;

    @Data
    @NoArgsConstructor
    public static class NutrientTargets {
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
    }

    @Data
    @NoArgsConstructor
    public static class FoodRecommendation {
        @JsonProperty("food_id")
        private Integer foodId;

        @JsonProperty("food_name")
        private String foodName;

        private Double score;

        @JsonProperty("score_breakdown")
        private ScoreBreakdown scoreBreakdown;

        @JsonProperty("recommended_amount_g")
        private Double recommendedAmountG;

        @JsonProperty("amount_ratio")
        private Double amountRatio;

        @JsonProperty("nutrients_per_serving")
        private NutrientTargets nutrientsPerServing;

        @JsonProperty("reason_tags")
        private List<String> reasonTags;
    }

    @Data
    @NoArgsConstructor
    public static class ScoreBreakdown {
        @JsonProperty("gap_match")
        private Double gapMatch;

        @JsonProperty("goal_alignment")
        private Double goalAlignment;

        @JsonProperty("disease_compliance")
        private Double diseaseCompliance;

        private Double preference;

        private Double feedback;
    }
}
