package com.NurtiAgent.Onboard.profile.dto;

import com.NurtiAgent.Onboard.common.enums.*;
import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProfileResponse {

    private String userId;
    private Integer age;
    private Gender gender;
    private Double height;
    private Double weight;
    private HealthGoal healthGoal;
    private ActivityLevel activityLevel;
    private Integer exerciseFrequency;
    private ExerciseTime exerciseTime;
    private MealPattern mealPattern;
    private List<String> preferredFoods;
    private List<String> dislikedFoods;
    private List<String> allergies;
    private List<Disease> diseases;
    private List<DietStyle> dietStyles;
    private Double waterIntakeGoal;
    private DietaryConstraintsDto constraints;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
