package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.meal.dto.*;
import com.NurtiAgent.Onboard.meal.entity.Food;
import com.NurtiAgent.Onboard.meal.entity.Meal;
import com.NurtiAgent.Onboard.meal.repository.FoodRepository;
import com.NurtiAgent.Onboard.meal.repository.MealRepository;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import com.NurtiAgent.Onboard.profile.repository.NutritionTargetRepository;
import com.NurtiAgent.Onboard.profile.repository.UserProfileRepository;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MealService {

    private final MealRepository mealRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final NutritionTargetRepository nutritionTargetRepository;

    @Transactional
    public MealResponse createMeal(String guestId, MealRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. 음식 정보 조회
        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new RuntimeException("음식 정보를 찾을 수 없습니다"));

        // 3. 날짜 검증 (과거 30일 ~ 오늘)
        LocalDate mealDate = LocalDate.parse(request.getDate());
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);

        if (mealDate.isBefore(thirtyDaysAgo) || mealDate.isAfter(today)) {
            throw new IllegalArgumentException("과거 30일 ~ 오늘까지만 기록 가능합니다");
        }

        // 4. 영양소 계산 (섭취량 기준)
        double ratio = request.getAmount() / food.getWeight();
        double calories = food.getCalories() * ratio;
        Double protein = food.getProtein() != null ? food.getProtein() * ratio : null;
        Double carbs = food.getCarbs() != null ? food.getCarbs() * ratio : null;
        Double fat = food.getFat() != null ? food.getFat() * ratio : null;

        // 5. Meal 엔티티 생성 및 저장
        Meal meal = Meal.builder()
                .user(user)
                .food(food)
                .foodName(food.getName())
                .amount(request.getAmount())
                .calories(calories)
                .protein(protein)
                .carbs(carbs)
                .fat(fat)
                .mealType(request.getMealType())
                .date(mealDate)
                .source(request.getSource())
                .setId(request.getSetId())
                .build();

        Meal savedMeal = mealRepository.save(meal);

        // 6. Response 생성
        return MealResponse.builder()
                .id(savedMeal.getId())
                .userId(user.getGuestId())
                .foodId(food.getId())
                .foodName(savedMeal.getFoodName())
                .amount(savedMeal.getAmount())
                .calories(savedMeal.getCalories())
                .protein(savedMeal.getProtein())
                .carbs(savedMeal.getCarbs())
                .fat(savedMeal.getFat())
                .mealType(savedMeal.getMealType())
                .date(savedMeal.getDate().toString())
                .createdAt(savedMeal.getCreatedAt())
                .updatedAt(savedMeal.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public MealListResponse getMealsByDate(String guestId, String dateStr) {
        // 1. 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. 날짜 파싱
        LocalDate date = LocalDate.parse(dateStr);

        // 3. 해당 날짜의 식단 기록 조회
        List<Meal> meals = mealRepository.findByUserAndDateOrderByCreatedAtAsc(user, date);

        // 4. 영양소 합계 계산
        double totalCalories = meals.stream()
                .mapToDouble(Meal::getCalories)
                .sum();
        double totalProtein = meals.stream()
                .filter(m -> m.getProtein() != null)
                .mapToDouble(Meal::getProtein)
                .sum();
        double totalCarbs = meals.stream()
                .filter(m -> m.getCarbs() != null)
                .mapToDouble(Meal::getCarbs)
                .sum();
        double totalFat = meals.stream()
                .filter(m -> m.getFat() != null)
                .mapToDouble(Meal::getFat)
                .sum();

        // 5. Summary 생성
        MealListResponse.NutritionSummary.NutritionSummaryBuilder summaryBuilder =
                MealListResponse.NutritionSummary.builder()
                        .totalCalories(totalCalories)
                        .totalProtein(totalProtein)
                        .totalCarbs(totalCarbs)
                        .totalFat(totalFat);

        // 6. 온보딩 완료 여부 확인 및 목표 추가
        UserProfile userProfile = userProfileRepository.findByUser(user).orElse(null);
        if (userProfile != null && userProfile.getOnboardingCompleted()) {
            NutritionTarget target = nutritionTargetRepository.findByUser(user)
                    .orElse(null);

            if (target != null) {
                summaryBuilder
                        .targetCalories(target.getCalories())
                        .targetProtein(target.getProtein())
                        .targetCarbs(target.getCarbs())
                        .targetFat(target.getFat())
                        .caloriesAchievement(calculateAchievement(totalCalories, target.getCalories()))
                        .proteinAchievement(calculateAchievement(totalProtein, target.getProtein()))
                        .carbsAchievement(calculateAchievement(totalCarbs, target.getCarbs()))
                        .fatAchievement(calculateAchievement(totalFat, target.getFat()));
            }
        }

        // 7. Meal 목록 변환
        List<MealItemResponse> mealItems = meals.stream()
                .map(meal -> MealItemResponse.builder()
                        .id(meal.getId())
                        .foodName(meal.getFoodName())
                        .amount(meal.getAmount())
                        .calories(meal.getCalories())
                        .protein(meal.getProtein())
                        .carbs(meal.getCarbs())
                        .fat(meal.getFat())
                        .mealType(meal.getMealType())
                        .createdAt(meal.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return MealListResponse.builder()
                .date(dateStr)
                .summary(summaryBuilder.build())
                .meals(mealItems)
                .build();
    }

    @Transactional
    public MealResponse updateMeal(String guestId, Long mealId, MealUpdateRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. Meal 조회 및 권한 확인
        Meal meal = mealRepository.findByIdAndUser(mealId, user)
                .orElseThrow(() -> new RuntimeException("수정할 기록을 찾을 수 없습니다"));

        // 3. 부분 수정 (Partial Update)
        boolean needsRecalculation = false;

        if (request.getAmount() != null) {
            meal.setAmount(request.getAmount());
            needsRecalculation = true;
        }

        if (request.getMealType() != null) {
            meal.setMealType(request.getMealType());
        }

        if (request.getDate() != null) {
            LocalDate newDate = LocalDate.parse(request.getDate());
            LocalDate today = LocalDate.now();
            LocalDate thirtyDaysAgo = today.minusDays(30);

            if (newDate.isBefore(thirtyDaysAgo) || newDate.isAfter(today)) {
                throw new IllegalArgumentException("과거 30일 ~ 오늘까지만 기록 가능합니다");
            }
            meal.setDate(newDate);
        }

        // 4. 섭취량이 변경되었으면 영양소 재계산
        if (needsRecalculation) {
            Food food = meal.getFood();
            double ratio = meal.getAmount() / food.getWeight();
            meal.setCalories(food.getCalories() * ratio);
            meal.setProtein(food.getProtein() != null ? food.getProtein() * ratio : null);
            meal.setCarbs(food.getCarbs() != null ? food.getCarbs() * ratio : null);
            meal.setFat(food.getFat() != null ? food.getFat() * ratio : null);
        }

        Meal updatedMeal = mealRepository.save(meal);

        // 5. Response 생성
        return MealResponse.builder()
                .id(updatedMeal.getId())
                .userId(user.getGuestId())
                .foodId(updatedMeal.getFood().getId())
                .foodName(updatedMeal.getFoodName())
                .amount(updatedMeal.getAmount())
                .calories(updatedMeal.getCalories())
                .protein(updatedMeal.getProtein())
                .carbs(updatedMeal.getCarbs())
                .fat(updatedMeal.getFat())
                .mealType(updatedMeal.getMealType())
                .date(updatedMeal.getDate().toString())
                .createdAt(updatedMeal.getCreatedAt())
                .updatedAt(updatedMeal.getUpdatedAt())
                .build();
    }

    @Transactional
    public MealDeleteResponse deleteMeal(String guestId, Long mealId) {
        // 1. 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. Meal 조회 및 권한 확인
        Meal meal = mealRepository.findByIdAndUser(mealId, user)
                .orElseThrow(() -> new RuntimeException("삭제할 기록을 찾을 수 없습니다"));

        // 3. 삭제
        mealRepository.delete(meal);

        return MealDeleteResponse.builder()
                .success(true)
                .message("식단 기록이 삭제되었습니다")
                .build();
    }

    @Transactional(readOnly = true)
    public MealSummaryResponse getMealSummary(String guestId, String dateStr) {
        // 1. 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. 날짜 파싱
        LocalDate date = LocalDate.parse(dateStr);

        // 3. 해당 날짜의 식단 기록 조회
        List<Meal> meals = mealRepository.findByUserAndDate(user, date);

        // 4. 영양소 합계 계산
        double totalCalories = meals.stream()
                .mapToDouble(Meal::getCalories)
                .sum();
        double totalProtein = meals.stream()
                .filter(m -> m.getProtein() != null)
                .mapToDouble(Meal::getProtein)
                .sum();
        double totalCarbs = meals.stream()
                .filter(m -> m.getCarbs() != null)
                .mapToDouble(Meal::getCarbs)
                .sum();
        double totalFat = meals.stream()
                .filter(m -> m.getFat() != null)
                .mapToDouble(Meal::getFat)
                .sum();

        MealSummaryResponse.ConsumedNutrition consumed = MealSummaryResponse.ConsumedNutrition.builder()
                .calories(totalCalories)
                .protein(totalProtein)
                .carbs(totalCarbs)
                .fat(totalFat)
                .build();

        return MealSummaryResponse.builder()
                .consumed(consumed)
                .build();
    }

    private double calculateAchievement(double actual, Double target) {
        if (target == null || target == 0) {
            return 0.0;
        }
        return Math.round((actual / target * 100) * 10.0) / 10.0; // 소수점 첫째자리까지
    }
}
