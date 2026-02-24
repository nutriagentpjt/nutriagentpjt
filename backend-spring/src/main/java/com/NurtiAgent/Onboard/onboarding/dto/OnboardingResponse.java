package com.NurtiAgent.Onboard.onboarding.dto;

import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo;
import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo.*;

import java.time.LocalDateTime;
import java.util.List;

public record OnboardingResponse(
        Long id,
        Integer age,
        Gender gender,
        Double height,
        Double weight,
        HealthGoal healthGoal,
        ActivityLevel activityLevel,
        Integer exerciseFrequency,
        String exerciseTime,
        MealPattern mealPattern,
        List<String> preferredFoods,
        List<String> dislikedFoods,
        List<Disease> diseases,
        LocalDateTime createdAt,
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
