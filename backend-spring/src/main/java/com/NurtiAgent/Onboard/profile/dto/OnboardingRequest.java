package com.NurtiAgent.Onboard.profile.dto;

import com.NurtiAgent.Onboard.common.enums.*;
import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingRequest {

    @NotNull(message = "나이는 필수 입력입니다")
    @Min(value = 1, message = "나이는 1 이상이어야 합니다")
    @Max(value = 150, message = "나이는 150 이하여야 합니다")
    private Integer age;

    @NotNull(message = "성별은 필수 선택입니다")
    private Gender gender;

    @NotNull(message = "키는 필수 입력입니다")
    @DecimalMin(value = "50.0", message = "키는 50.0 이상이어야 합니다")
    @DecimalMax(value = "250.0", message = "키는 250.0 이하여야 합니다")
    private Double height;

    @NotNull(message = "몸무게는 필수 입력입니다")
    @DecimalMin(value = "20.0", message = "몸무게는 20.0 이상이어야 합니다")
    @DecimalMax(value = "350.0", message = "몸무게는 350.0 이하여야 합니다")
    private Double weight;

    @NotNull(message = "건강 목표는 필수 선택입니다")
    private HealthGoal healthGoal;

    @NotNull(message = "활동 수준은 필수 선택입니다")
    private ActivityLevel activityLevel;

    @NotNull(message = "운동 빈도는 필수 입력입니다")
    @Min(value = 1, message = "운동 빈도는 최소 1일입니다")
    @Max(value = 7, message = "운동 빈도는 최대 7일입니다")
    private Integer exerciseFrequency;

    private ExerciseTime exerciseTime;

    @NotNull(message = "식사 패턴은 필수 선택입니다")
    private MealPattern mealPattern;

    private List<String> preferredFoods;

    private List<DislikedFoodDto> dislikedFoods;

    private List<String> allergies;

    private List<Disease> diseases;

    private List<DietStyle> dietStyles;

    @DecimalMin(value = "0.0", message = "물 섭취 목표는 0 이상이어야 합니다")
    @DecimalMax(value = "10.0", message = "물 섭취 목표는 10.0 이하여야 합니다")
    private Double waterIntakeGoal;

    private DietaryConstraintsDto constraints;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DislikedFoodDto {
        @NotBlank(message = "음식명은 필수입니다")
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
        @Min(value = 0, message = "끼니당 최대 칼로리는 0 이상이어야 합니다")
        private Integer maxCaloriesPerMeal;
    }
}
