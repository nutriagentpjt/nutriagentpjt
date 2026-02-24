package com.NurtiAgent.Onboard.onboarding.dto;

import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo.*;
import jakarta.validation.constraints.*;

import java.util.List;

public record OnboardingRequest(
        @NotNull(message = "나이는 필수 입력입니다.")
        @Min(value = 1, message = "나이는 1 이상이어야 합니다.")
        @Max(value = 150, message = "나이는 150 이하여야 합니다.")
        Integer age,

        @NotNull(message = "성별은 필수 선택입니다.")
        Gender gender,

        @DecimalMin(value = "0.0", inclusive = false, message = "키는 0보다 커야 합니다.")
        @DecimalMax(value = "300.0", message = "키는 300 이하여야 합니다.")
        Double height,

        @DecimalMin(value = "0.0", inclusive = false, message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "500.0", message = "몸무게는 500 이하여야 합니다.")
        Double weight,

        @NotNull(message = "건강 목표는 필수 선택입니다.")
        HealthGoal healthGoal,

        @NotNull(message = "활동 수준은 필수 선택입니다.")
        ActivityLevel activityLevel,

        @NotNull(message = "운동 빈도는 필수 입력입니다.")
        @Min(value = 1, message = "운동 빈도는 최소 1일입니다.")
        @Max(value = 7, message = "운동 빈도는 최대 7일입니다.")
        Integer exerciseFrequency,

        String exerciseTime,

        @NotNull(message = "식사 패턴은 필수 선택입니다.")
        MealPattern mealPattern,

        List<String> preferredFoods,

        List<String> dislikedFoods,

        List<Disease> diseases
) {
}
