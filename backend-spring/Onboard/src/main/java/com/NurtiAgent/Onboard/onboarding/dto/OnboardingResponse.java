package com.NurtiAgent.Onboard.onboarding.dto;

import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo;
import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo.*;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "온보딩 정보 응답")
public record OnboardingResponse(
        @Schema(description = "온보딩 정보 ID", example = "1")
        Long id,

        @Schema(description = "나이", example = "25")
        Integer age,

        @Schema(description = "성별", example = "MALE")
        Gender gender,

        @Schema(description = "키 (cm)", example = "175.5")
        Double height,

        @Schema(description = "몸무게 (kg)", example = "70.5")
        Double weight,

        @Schema(description = "건강 목표", example = "DIET")
        HealthGoal healthGoal,

        @Schema(description = "활동 수준", example = "MODERATELY_ACTIVE")
        ActivityLevel activityLevel,

        @Schema(description = "주당 운동 빈도 (1~7일)", example = "3")
        Integer exerciseFrequency,

        @Schema(description = "운동 시간대", example = "오전")
        String exerciseTime,

        @Schema(description = "식사 패턴", example = "THREE_MEALS")
        MealPattern mealPattern,

        @Schema(description = "선호 음식 리스트", example = "[\"닭가슴살\", \"현미\", \"브로콜리\"]")
        List<String> preferredFoods,

        @Schema(description = "비선호 음식 리스트", example = "[\"돼지고기\", \"새우\"]")
        List<String> dislikedFoods,

        @Schema(description = "질환 정보 리스트", example = "[\"DIABETES\", \"HYPERTENSION\"]")
        List<Disease> diseases,

        @Schema(description = "생성 시간", example = "2025-01-15T10:30:00")
        LocalDateTime createdAt,

        @Schema(description = "수정 시간", example = "2025-01-15T10:30:00")
        LocalDateTime updatedAt
) {
    public static OnboardingResponse from(OnboardingInfo onboardingInfo) {
        return new OnboardingResponse(
                onboardingInfo.getId(),
                onboardingInfo.getAge(),
                onboardingInfo.getGender(),
                onboardingInfo.getHeight(),
                onboardingInfo.getWeight(),
                onboardingInfo.getHealthGoal(),
                onboardingInfo.getActivityLevel(),
                onboardingInfo.getExerciseFrequency(),
                onboardingInfo.getExerciseTime(),
                onboardingInfo.getMealPattern(),
                onboardingInfo.getPreferredFoods(),
                onboardingInfo.getDislikedFoods(),
                onboardingInfo.getDiseases(),
                onboardingInfo.getCreatedAt(),
                onboardingInfo.getUpdatedAt()
        );
    }
}
