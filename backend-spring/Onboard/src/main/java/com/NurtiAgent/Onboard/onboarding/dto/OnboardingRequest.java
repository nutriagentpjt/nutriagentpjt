package com.NurtiAgent.Onboard.onboarding.dto;

import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo.*;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.util.List;

@Schema(description = "온보딩 정보 등록 요청")
public record OnboardingRequest(
        @Schema(description = "나이", example = "25")
        @NotNull(message = "나이는 필수 입력입니다.")
        @Min(value = 1, message = "나이는 1 이상이어야 합니다.")
        @Max(value = 150, message = "나이는 150 이하여야 합니다.")
        Integer age,

        @Schema(description = "성별", example = "MALE", allowableValues = {"MALE", "FEMALE"})
        @NotNull(message = "성별은 필수 선택입니다.")
        Gender gender,

        @Schema(description = "키 (cm)", example = "175.5")
        @DecimalMin(value = "0.0", inclusive = false, message = "키는 0보다 커야 합니다.")
        @DecimalMax(value = "300.0", message = "키는 300 이하여야 합니다.")
        Double height,

        @Schema(description = "몸무게 (kg)", example = "70.5")
        @DecimalMin(value = "0.0", inclusive = false, message = "몸무게는 0보다 커야 합니다.")
        @DecimalMax(value = "500.0", message = "몸무게는 500 이하여야 합니다.")
        Double weight,

        @Schema(description = "건강 목표", example = "DIET", allowableValues = {"DIET", "BULK_UP", "LEAN_MASS_UP"})
        @NotNull(message = "건강 목표는 필수 선택입니다.")
        HealthGoal healthGoal,

        @Schema(description = "활동 수준", example = "MODERATELY_ACTIVE",
                allowableValues = {"SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE"})
        @NotNull(message = "활동 수준은 필수 선택입니다.")
        ActivityLevel activityLevel,

        @Schema(description = "주당 운동 빈도 (1~7일)", example = "3")
        @NotNull(message = "운동 빈도는 필수 입력입니다.")
        @Min(value = 1, message = "운동 빈도는 최소 1일입니다.")
        @Max(value = 7, message = "운동 빈도는 최대 7일입니다.")
        Integer exerciseFrequency,

        @Schema(description = "운동 시간대", example = "오전")
        String exerciseTime,

        @Schema(description = "식사 패턴", example = "THREE_MEALS",
                allowableValues = {"TWO_MEALS", "THREE_MEALS", "INTERMITTENT_FASTING", "MULTIPLE_SMALL_MEALS"})
        @NotNull(message = "식사 패턴은 필수 선택입니다.")
        MealPattern mealPattern,

        @Schema(description = "선호 음식 리스트", example = "[\"닭가슴살\", \"현미\", \"브로콜리\"]")
        List<String> preferredFoods,

        @Schema(description = "비선호 음식 리스트", example = "[\"돼지고기\", \"새우\"]")
        List<String> dislikedFoods,

        @Schema(description = "질환 정보 리스트", example = "[\"DIABETES\", \"HYPERTENSION\"]",
                allowableValues = {"NONE", "ALLERGY", "DIABETES", "HYPERTENSION", "HYPERLIPIDEMIA",
                                   "GOUT", "KIDNEY_DISEASE", "LIVER_DISEASE", "THYROID_DISEASE"})
        List<Disease> diseases
) {
}
