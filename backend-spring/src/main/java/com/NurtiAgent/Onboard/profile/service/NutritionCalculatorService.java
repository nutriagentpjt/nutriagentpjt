package com.NurtiAgent.Onboard.profile.service;

import com.NurtiAgent.Onboard.common.enums.ActivityLevel;
import com.NurtiAgent.Onboard.common.enums.Gender;
import com.NurtiAgent.Onboard.common.enums.HealthGoal;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

@Service
public class NutritionCalculatorService {

    /**
     * Harris-Benedict 공식을 사용하여 BMR (기초대사량) 계산
     */
    public double calculateBMR(Gender gender, int age, double height, double weight) {
        if (gender == Gender.MALE) {
            // 남성: BMR = 88.362 + (13.397 × 체중kg) + (4.799 × 키cm) - (5.677 × 나이)
            return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            // 여성: BMR = 447.593 + (9.247 × 체중kg) + (3.098 × 키cm) - (4.330 × 나이)
            return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
    }

    /**
     * 활동 수준에 따라 TDEE (총 일일 에너지 소비량) 계산
     */
    public double calculateTDEE(double bmr, ActivityLevel activityLevel) {
        double multiplier = switch (activityLevel) {
            case SEDENTARY -> 1.2;           // 거의 운동 안 함
            case LIGHTLY_ACTIVE -> 1.375;    // 가벼운 활동
            case MODERATELY_ACTIVE -> 1.55;  // 보통 활동
            case VERY_ACTIVE -> 1.725;       // 매우 활동적
        };
        return bmr * multiplier;
    }

    /**
     * 건강 목표에 따라 목표 칼로리 계산
     */
    public double calculateTargetCalories(double tdee, HealthGoal healthGoal) {
        return switch (healthGoal) {
            case DIET -> tdee * 0.8;              // 다이어트: TDEE의 80%
            case BULK_UP -> tdee * 1.15;          // 벌크업: TDEE의 115%
            case LEAN_MASS_UP -> tdee * 1.1;      // 린매스업: TDEE의 110%
            case MAINTAIN -> tdee;                 // 체중 유지: TDEE 그대로
            case GENERAL_HEALTH -> tdee;           // 일반 건강: TDEE 그대로
        };
    }

    /**
     * 목표 칼로리 기반으로 영양소 목표 계산
     */
    public MacroNutrients calculateMacroNutrients(double targetCalories, HealthGoal healthGoal) {
        double proteinRatio, carbRatio, fatRatio;

        switch (healthGoal) {
            case DIET, LEAN_MASS_UP -> {
                // 다이어트/린매스업: 고단백, 중탄수, 저지방
                proteinRatio = 0.30;
                carbRatio = 0.40;
                fatRatio = 0.30;
            }
            case BULK_UP -> {
                // 벌크업: 고단백, 고탄수, 중지방
                proteinRatio = 0.25;
                carbRatio = 0.50;
                fatRatio = 0.25;
            }
            default -> {
                // 체중 유지/일반 건강: 균형 잡힌 비율
                proteinRatio = 0.20;
                carbRatio = 0.50;
                fatRatio = 0.30;
            }
        }

        // 칼로리를 그램으로 변환 (단백질: 4kcal/g, 탄수화물: 4kcal/g, 지방: 9kcal/g)
        double proteinGrams = (targetCalories * proteinRatio) / 4;
        double carbsGrams = (targetCalories * carbRatio) / 4;
        double fatGrams = (targetCalories * fatRatio) / 9;

        return MacroNutrients.builder()
                .calories(targetCalories)
                .protein(proteinGrams)
                .carbs(carbsGrams)
                .fat(fatGrams)
                .build();
    }

    /**
     * UserProfile 기반으로 전체 영양소 목표 계산
     */
    public NutritionResult calculateNutritionTargets(UserProfile profile) {
        double bmr = calculateBMR(profile.getGender(), profile.getAge(),
                                   profile.getHeight(), profile.getWeight());
        double tdee = calculateTDEE(bmr, profile.getActivityLevel());
        double targetCalories = calculateTargetCalories(tdee, profile.getHealthGoal());
        MacroNutrients macros = calculateMacroNutrients(targetCalories, profile.getHealthGoal());

        return NutritionResult.builder()
                .bmr(bmr)
                .tdee(tdee)
                .targetCalories(targetCalories)
                .protein(macros.getProtein())
                .carbs(macros.getCarbs())
                .fat(macros.getFat())
                .build();
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class MacroNutrients {
        private double calories;
        private double protein;
        private double carbs;
        private double fat;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class NutritionResult {
        private double bmr;
        private double tdee;
        private double targetCalories;
        private double protein;
        private double carbs;
        private double fat;
    }
}
