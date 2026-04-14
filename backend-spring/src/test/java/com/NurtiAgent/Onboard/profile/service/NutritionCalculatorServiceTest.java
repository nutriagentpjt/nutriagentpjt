package com.NurtiAgent.Onboard.profile.service;

import com.NurtiAgent.Onboard.common.enums.ActivityLevel;
import com.NurtiAgent.Onboard.common.enums.Gender;
import com.NurtiAgent.Onboard.common.enums.HealthGoal;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * NutritionCalculatorService 단위 테스트
 *
 * 테스트 대상 메서드:
 *   - calculateBMR(Gender, int, double, double)
 *   - calculateTDEE(double, ActivityLevel)
 *   - calculateTargetCalories(double, HealthGoal)
 *   - calculateMacroNutrients(double, HealthGoal, double)
 *   - calculateNutritionTargets(UserProfile)
 *
 * 의존성: 없음 (순수 계산 로직)
 */
class NutritionCalculatorServiceTest {

    private NutritionCalculatorService calculator;

    @BeforeEach
    void setUp() {
        calculator = new NutritionCalculatorService();
    }

    // ==================== calculateBMR ====================

    @Nested
    @DisplayName("BMR 계산 (Mifflin-St Jeor)")
    class CalculateBMR {

        @Test
        @DisplayName("남성 BMR: (10×체중) + (6.25×키) - (5×나이) + 5")
        void maleBMR() {
            // 30세 남성, 175cm, 70kg
            // BMR = (10*70) + (6.25*175) - (5*30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
            double bmr = calculator.calculateBMR(Gender.MALE, 30, 175.0, 70.0);
            assertThat(bmr).isCloseTo(1648.75, within(0.01));
        }

        @Test
        @DisplayName("여성 BMR: (10×체중) + (6.25×키) - (5×나이) - 161")
        void femaleBMR() {
            // 25세 여성, 163cm, 55kg
            // BMR = (10*55) + (6.25*163) - (5*25) - 161 = 550 + 1018.75 - 125 - 161 = 1282.75
            double bmr = calculator.calculateBMR(Gender.FEMALE, 25, 163.0, 55.0);
            assertThat(bmr).isCloseTo(1282.75, within(0.01));
        }

        @Test
        @DisplayName("남녀 BMR 차이: 동일 조건에서 남성이 여성보다 166 높음")
        void maleBMRIsHigherThanFemaleByConstant() {
            double maleBMR   = calculator.calculateBMR(Gender.MALE,   30, 170.0, 65.0);
            double femaleBMR = calculator.calculateBMR(Gender.FEMALE, 30, 170.0, 65.0);
            // 남성 공식 +5, 여성 -161 → 차이 166
            assertThat(maleBMR - femaleBMR).isCloseTo(166.0, within(0.001));
        }

        @Test
        @DisplayName("나이가 증가할수록 BMR 감소")
        void olderAgeLowerBMR() {
            double youngBMR = calculator.calculateBMR(Gender.MALE, 20, 170.0, 70.0);
            double oldBMR   = calculator.calculateBMR(Gender.MALE, 60, 170.0, 70.0);
            assertThat(youngBMR).isGreaterThan(oldBMR);
        }

        @Test
        @DisplayName("체중이 증가할수록 BMR 증가")
        void heavierWeightHigherBMR() {
            double lightBMR  = calculator.calculateBMR(Gender.MALE, 30, 170.0, 50.0);
            double heavyBMR  = calculator.calculateBMR(Gender.MALE, 30, 170.0, 100.0);
            assertThat(heavyBMR).isGreaterThan(lightBMR);
        }
    }

    // ==================== calculateTDEE ====================

    @Nested
    @DisplayName("TDEE 계산 (활동 수준 적용)")
    class CalculateTDEE {

        private static final double BASE_BMR = 1600.0;

        @Test
        @DisplayName("SEDENTARY: BMR × 1.2")
        void sedentaryMultiplier() {
            assertThat(calculator.calculateTDEE(BASE_BMR, ActivityLevel.SEDENTARY))
                    .isCloseTo(1920.0, within(0.001));
        }

        @Test
        @DisplayName("LIGHTLY_ACTIVE: BMR × 1.375")
        void lightlyActiveMultiplier() {
            assertThat(calculator.calculateTDEE(BASE_BMR, ActivityLevel.LIGHTLY_ACTIVE))
                    .isCloseTo(2200.0, within(0.001));
        }

        @Test
        @DisplayName("MODERATELY_ACTIVE: BMR × 1.55")
        void moderatelyActiveMultiplier() {
            assertThat(calculator.calculateTDEE(BASE_BMR, ActivityLevel.MODERATELY_ACTIVE))
                    .isCloseTo(2480.0, within(0.001));
        }

        @Test
        @DisplayName("VERY_ACTIVE: BMR × 1.725")
        void veryActiveMultiplier() {
            assertThat(calculator.calculateTDEE(BASE_BMR, ActivityLevel.VERY_ACTIVE))
                    .isCloseTo(2760.0, within(0.001));
        }

        @Test
        @DisplayName("활동 수준이 높을수록 TDEE 증가")
        void higherActivityHigherTDEE() {
            double sed  = calculator.calculateTDEE(BASE_BMR, ActivityLevel.SEDENTARY);
            double mod  = calculator.calculateTDEE(BASE_BMR, ActivityLevel.MODERATELY_ACTIVE);
            double very = calculator.calculateTDEE(BASE_BMR, ActivityLevel.VERY_ACTIVE);
            assertThat(sed).isLessThan(mod).isLessThan(very);
        }
    }

    // ==================== calculateTargetCalories ====================

    @Nested
    @DisplayName("목표 칼로리 계산 (건강 목표 적용)")
    class CalculateTargetCalories {

        private static final double TDEE = 2000.0;

        @Test
        @DisplayName("DIET: TDEE × 0.85 (15% 감량)")
        void dietReducesByFifteenPercent() {
            assertThat(calculator.calculateTargetCalories(TDEE, HealthGoal.DIET))
                    .isCloseTo(1700.0, within(0.001));
        }

        @Test
        @DisplayName("BULK_UP: TDEE × 1.15 (15% 증가)")
        void bulkUpIncreasesByFifteenPercent() {
            assertThat(calculator.calculateTargetCalories(TDEE, HealthGoal.BULK_UP))
                    .isCloseTo(2300.0, within(0.001));
        }

        @Test
        @DisplayName("LEAN_MASS_UP: TDEE × 1.10 (10% 증가)")
        void leanMassUpIncreasesByTenPercent() {
            assertThat(calculator.calculateTargetCalories(TDEE, HealthGoal.LEAN_MASS_UP))
                    .isCloseTo(2200.0, within(0.001));
        }

        @Test
        @DisplayName("MAINTAIN: TDEE 그대로 유지")
        void maintainKeepsTDEE() {
            assertThat(calculator.calculateTargetCalories(TDEE, HealthGoal.MAINTAIN))
                    .isCloseTo(2000.0, within(0.001));
        }

        @Test
        @DisplayName("GENERAL_HEALTH: TDEE 그대로 유지")
        void generalHealthKeepsTDEE() {
            assertThat(calculator.calculateTargetCalories(TDEE, HealthGoal.GENERAL_HEALTH))
                    .isCloseTo(2000.0, within(0.001));
        }

        @Test
        @DisplayName("DIET < MAINTAIN < LEAN_MASS_UP < BULK_UP 순서 보장")
        void caloriesOrderByGoal() {
            double diet      = calculator.calculateTargetCalories(TDEE, HealthGoal.DIET);
            double maintain  = calculator.calculateTargetCalories(TDEE, HealthGoal.MAINTAIN);
            double leanMass  = calculator.calculateTargetCalories(TDEE, HealthGoal.LEAN_MASS_UP);
            double bulkUp    = calculator.calculateTargetCalories(TDEE, HealthGoal.BULK_UP);
            assertThat(diet).isLessThan(maintain);
            assertThat(maintain).isLessThan(leanMass);
            assertThat(leanMass).isLessThan(bulkUp);
        }
    }

    // ==================== calculateMacroNutrients ====================

    @Nested
    @DisplayName("매크로 영양소 계산")
    class CalculateMacroNutrients {

        @Test
        @DisplayName("MAINTAIN: 탄50 단20 지30 칼로리 비율 적용")
        void maintainUsesFiftyTwentyThirtyRatio() {
            double calories = 2000.0;
            double weight   = 70.0;
            NutritionCalculatorService.MacroNutrients macros =
                    calculator.calculateMacroNutrients(calories, HealthGoal.MAINTAIN, weight);

            // 단백질 = 2000 * 0.20 / 4 = 100g
            // 탄수화물 = 2000 * 0.50 / 4 = 250g
            // 지방 = 2000 * 0.30 / 9 ≈ 66.67g
            assertThat(macros.getCalories()).isCloseTo(2000.0, within(0.001));
            assertThat(macros.getProtein()).isCloseTo(100.0, within(0.001));
            assertThat(macros.getCarbs()).isCloseTo(250.0, within(0.001));
            assertThat(macros.getFat()).isCloseTo(66.67, within(0.01));
        }

        @Test
        @DisplayName("DIET: 단백질은 체중 기반(2.0g/kg), 40% 상한 적용")
        void dietProteinBaseOnWeight() {
            // 70kg, 2000 kcal
            // 단백질 = min(70*2.0, 2000*0.40/4) = min(140, 200) = 140g
            NutritionCalculatorService.MacroNutrients macros =
                    calculator.calculateMacroNutrients(2000.0, HealthGoal.DIET, 70.0);

            assertThat(macros.getProtein()).isCloseTo(140.0, within(0.001));
        }

        @Test
        @DisplayName("DIET: 단백질이 40% 한도를 초과하면 40%로 제한")
        void dietProteinCappedAtFortyPercent() {
            // 체중 200kg, 1000 kcal → 200*2.0=400g 이지만 한도 = 1000*0.40/4=100g
            NutritionCalculatorService.MacroNutrients macros =
                    calculator.calculateMacroNutrients(1000.0, HealthGoal.DIET, 200.0);

            double cap = (1000.0 * 0.40) / 4; // 100g
            assertThat(macros.getProtein()).isCloseTo(cap, within(0.001));
        }

        @Test
        @DisplayName("BULK_UP: 단백질은 체중 기반(1.6g/kg), 35% 상한 적용")
        void bulkUpProteinBaseOnWeight() {
            // 70kg, 2300 kcal
            // 단백질 = min(70*1.6, 2300*0.35/4) = min(112, 201.25) = 112g
            NutritionCalculatorService.MacroNutrients macros =
                    calculator.calculateMacroNutrients(2300.0, HealthGoal.BULK_UP, 70.0);

            assertThat(macros.getProtein()).isCloseTo(112.0, within(0.001));
        }

        @Test
        @DisplayName("LEAN_MASS_UP: 단백질은 체중 기반(1.8g/kg)")
        void leanMassUpProteinBaseOnWeight() {
            // 70kg, 2200 kcal
            // 단백질 = min(70*1.8, 2200*0.40/4) = min(126, 220) = 126g
            NutritionCalculatorService.MacroNutrients macros =
                    calculator.calculateMacroNutrients(2200.0, HealthGoal.LEAN_MASS_UP, 70.0);

            assertThat(macros.getProtein()).isCloseTo(126.0, within(0.001));
        }

        @Test
        @DisplayName("GENERAL_HEALTH: MAINTAIN과 동일한 비율 사용")
        void generalHealthSameAsMaintain() {
            double calories = 2000.0;
            double weight   = 70.0;
            NutritionCalculatorService.MacroNutrients maintain =
                    calculator.calculateMacroNutrients(calories, HealthGoal.MAINTAIN, weight);
            NutritionCalculatorService.MacroNutrients general =
                    calculator.calculateMacroNutrients(calories, HealthGoal.GENERAL_HEALTH, weight);

            assertThat(general.getProtein()).isCloseTo(maintain.getProtein(), within(0.001));
            assertThat(general.getCarbs()).isCloseTo(maintain.getCarbs(), within(0.001));
            assertThat(general.getFat()).isCloseTo(maintain.getFat(), within(0.001));
        }

        @Test
        @DisplayName("모든 목표: 단백질, 탄수화물, 지방 모두 양수")
        void allMacrosArePositive() {
            for (HealthGoal goal : HealthGoal.values()) {
                NutritionCalculatorService.MacroNutrients macros =
                        calculator.calculateMacroNutrients(2000.0, goal, 70.0);
                assertThat(macros.getProtein()).as("단백질 [%s]", goal).isPositive();
                assertThat(macros.getCarbs()).as("탄수화물 [%s]", goal).isPositive();
                assertThat(macros.getFat()).as("지방 [%s]", goal).isPositive();
            }
        }
    }

    // ==================== calculateNutritionTargets ====================

    @Nested
    @DisplayName("전체 영양 목표 오케스트레이션")
    class CalculateNutritionTargets {

        @Test
        @DisplayName("정상 프로필: BMR, TDEE, 목표 칼로리, 매크로 모두 계산됨")
        void normalProfileCalculatesAll() {
            UserProfile profile = UserProfile.builder()
                    .gender(Gender.MALE)
                    .age(30)
                    .height(175.0)
                    .weight(70.0)
                    .activityLevel(ActivityLevel.MODERATELY_ACTIVE)
                    .healthGoal(HealthGoal.MAINTAIN)
                    .build();

            NutritionCalculatorService.NutritionResult result =
                    calculator.calculateNutritionTargets(profile);

            double expectedBMR = calculator.calculateBMR(Gender.MALE, 30, 175.0, 70.0);
            double expectedTDEE = calculator.calculateTDEE(expectedBMR, ActivityLevel.MODERATELY_ACTIVE);

            assertThat(result.getBmr()).isCloseTo(expectedBMR, within(0.001));
            assertThat(result.getTdee()).isCloseTo(expectedTDEE, within(0.001));
            assertThat(result.getTargetCalories()).isCloseTo(expectedTDEE, within(0.001));
            assertThat(result.getProtein()).isPositive();
            assertThat(result.getCarbs()).isPositive();
            assertThat(result.getFat()).isPositive();
        }

        @Test
        @DisplayName("다이어트 목표: 목표 칼로리가 TDEE보다 낮음")
        void dietGoalTargetLowerThanTDEE() {
            UserProfile profile = UserProfile.builder()
                    .gender(Gender.FEMALE)
                    .age(25)
                    .height(163.0)
                    .weight(60.0)
                    .activityLevel(ActivityLevel.LIGHTLY_ACTIVE)
                    .healthGoal(HealthGoal.DIET)
                    .build();

            NutritionCalculatorService.NutritionResult result =
                    calculator.calculateNutritionTargets(profile);

            assertThat(result.getTargetCalories()).isLessThan(result.getTdee());
        }

        @Test
        @DisplayName("벌크업 목표: 목표 칼로리가 TDEE보다 높음")
        void bulkUpGoalTargetHigherThanTDEE() {
            UserProfile profile = UserProfile.builder()
                    .gender(Gender.MALE)
                    .age(22)
                    .height(180.0)
                    .weight(75.0)
                    .activityLevel(ActivityLevel.VERY_ACTIVE)
                    .healthGoal(HealthGoal.BULK_UP)
                    .build();

            NutritionCalculatorService.NutritionResult result =
                    calculator.calculateNutritionTargets(profile);

            assertThat(result.getTargetCalories()).isGreaterThan(result.getTdee());
        }
    }
}
