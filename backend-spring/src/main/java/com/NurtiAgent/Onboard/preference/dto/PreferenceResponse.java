package com.NurtiAgent.Onboard.preference.dto;

import com.NurtiAgent.Onboard.common.enums.DietStyle;
import com.NurtiAgent.Onboard.common.enums.MealPattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceResponse {

    private MealPattern mealPattern;
    private List<String> preferredFoods;
    private List<DislikedFoodDto> dislikedFoods;
    private List<String> allergies;
    private List<DietStyle> dietStyles;
    private Double waterIntakeGoal;
    private DietaryConstraintsDto constraints;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DislikedFoodDto {
        private String foodName;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DietaryConstraintsDto {
        private Boolean lowSodium;
        private Boolean lowSugar;
        private Integer maxCaloriesPerMeal;
    }
}
