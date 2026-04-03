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
     * Mifflin-St Jeor 공식을 사용하여 BMR (기초대사량) 계산
     * 출처: Mifflin MD et al. "A new predictive equation for resting energy expenditure" Am J Clin Nutr. 1990
     * 실측치 대비 ±10% 이내 정확도
     */
    public double calculateBMR(Gender gender, int age, double height, double weight) {
        if (gender == Gender.MALE) {
            // 남성: BMR = (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) + 5
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            // 여성: BMR = (10 × 체중kg) + (6.25 × 키cm) - (5 × 나이) - 161
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
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
            case DIET -> tdee * 0.85;             // 다이어트: TDEE의 85% (-15%)
            case BULK_UP -> tdee * 1.15;          // 벌크업: TDEE의 115%
            case LEAN_MASS_UP -> tdee * 1.1;      // 린매스업: TDEE의 110%
            case MAINTAIN -> tdee;                 // 체중 유지: TDEE 그대로
            case GENERAL_HEALTH -> tdee;           // 일반 건강: TDEE 그대로
        };
    }

    /**
     * 목표 칼로리 및 체중 기반으로 영양소 목표 계산
     * 단백질은 체중 기반으로 먼저 계산한 뒤 나머지 칼로리를 탄수화물과 지방 비율로 분배
     * 출처: ISSN Position Stand (Jager et al., 2017) - 운동하는 성인 1.4-2.0 g/kg/day
     */
    public MacroNutrients calculateMacroNutrients(double targetCalories, HealthGoal healthGoal, double weight) {
        double proteinGrams, carbsGrams, fatGrams;

        switch (healthGoal) {
            case DIET -> {
                // 다이어트: 단백질 2.0 g/kg (근손실 방지), 남은 칼로리를 탄40:지30 비율로 배분
                // 단백질이 목표 칼로리의 40%를 초과하지 않도록 제한
                proteinGrams = Math.min(weight * 2.0, (targetCalories * 0.40) / 4);
                double proteinCalories = proteinGrams * 4;
                double remainingCalories = targetCalories - proteinCalories;
                carbsGrams = (remainingCalories * (40.0 / 70.0)) / 4;
                fatGrams = (remainingCalories * (30.0 / 70.0)) / 9;
            }
            case LEAN_MASS_UP -> {
                // 린매스업: 단백질 1.8 g/kg, 남은 칼로리를 탄45:지25 비율로 배분
                // 단백질이 목표 칼로리의 40%를 초과하지 않도록 제한
                proteinGrams = Math.min(weight * 1.8, (targetCalories * 0.40) / 4);
                double proteinCalories = proteinGrams * 4;
                double remainingCalories = targetCalories - proteinCalories;
                carbsGrams = (remainingCalories * (45.0 / 70.0)) / 4;
                fatGrams = (remainingCalories * (25.0 / 70.0)) / 9;
            }
            case BULK_UP -> {
                // 벌크업: 단백질 1.6 g/kg, 남은 칼로리를 탄50:지25 비율로 배분
                // 단백질이 목표 칼로리의 35%를 초과하지 않도록 제한
                proteinGrams = Math.min(weight * 1.6, (targetCalories * 0.35) / 4);
                double proteinCalories = proteinGrams * 4;
                double remainingCalories = targetCalories - proteinCalories;
                carbsGrams = (remainingCalories * (50.0 / 75.0)) / 4;
                fatGrams = (remainingCalories * (25.0 / 75.0)) / 9;
            }
            default -> {
                // 체중 유지/일반 건강: 칼로리 비율 기반 (탄50:단20:지30)
                proteinGrams = (targetCalories * 0.20) / 4;
                carbsGrams = (targetCalories * 0.50) / 4;
                fatGrams = (targetCalories * 0.30) / 9;
            }
        }

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
        MacroNutrients macros = calculateMacroNutrients(targetCalories, profile.getHealthGoal(), profile.getWeight());

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
