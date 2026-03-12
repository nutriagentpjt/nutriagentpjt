package com.NurtiAgent.Onboard.recommendation.service;

import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.MealSummaryResponse;
import com.NurtiAgent.Onboard.meal.service.FoodService;
import com.NurtiAgent.Onboard.meal.service.MealService;
import com.NurtiAgent.Onboard.profile.dto.NutritionTargetResponse;
import com.NurtiAgent.Onboard.profile.service.ProfileService;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse.*;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final MealService mealService;
    private final ProfileService profileService;
    private final FoodService foodService;

    @Transactional(readOnly = true)
    public RecommendationResponse getRecommendations(String guestId, String date, MealType mealType, Integer limit) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 1. 현재 섭취량 조회
        MealSummaryResponse summary = mealService.getMealSummary(guestId, date);

        // 2. 목표 섭취량 조회
        NutritionTargetResponse target;
        try {
            target = profileService.getNutritionTargets(guestId);
        } catch (Exception e) {
            throw new RuntimeException("목표 설정이 필요합니다");
        }

        // 3. 현재 섭취 영양소
        NutritionDto consumed = NutritionDto.builder()
                .calories(summary.getConsumed().getCalories())
                .protein(summary.getConsumed().getProtein())
                .carbs(summary.getConsumed().getCarbs())
                .fat(summary.getConsumed().getFat())
                .build();

        // 4. 목표 영양소
        NutritionDto targetNutrition = NutritionDto.builder()
                .calories(target.getTarget().getCalories())
                .protein(target.getTarget().getProtein())
                .carbs(target.getTarget().getCarbs())
                .fat(target.getTarget().getFat())
                .build();

        // 5. Gap 계산
        NutritionGapDto gap = NutritionGapDto.builder()
                .calories(targetNutrition.getCalories() - consumed.getCalories())
                .protein(targetNutrition.getProtein() - consumed.getProtein())
                .carbs(targetNutrition.getCarbs() - consumed.getCarbs())
                .fat(targetNutrition.getFat() - consumed.getFat())
                .build();

        // 6. 음식 추천 생성
        List<FoodRecommendationDto> recommendations = generateRecommendations(gap, limit != null ? limit : 10);

        // 7. 코칭 텍스트 생성
        String coachText = generateCoachText(gap, recommendations);

        // 8. Response 구성
        return RecommendationResponse.builder()
                .setId(UUID.randomUUID().toString())
                .date(date)
                .mealType(mealType)
                .summary(SummaryDto.builder()
                        .consumed(consumed)
                        .target(targetNutrition)
                        .build())
                .gap(gap)
                .recommendations(recommendations)
                .coachText(coachText)
                .build();
    }

    private List<FoodRecommendationDto> generateRecommendations(NutritionGapDto gap, int limit) {
        List<FoodRecommendationDto> recommendations = new ArrayList<>();

        // 간단한 룰 기반 추천 로직
        Map<String, Double> priorityMap = new HashMap<>();
        priorityMap.put("protein", gap.getProtein());
        priorityMap.put("calories", gap.getCalories());
        priorityMap.put("carbs", gap.getCarbs());

        // 가장 부족한 영양소 찾기
        String mostDeficient = priorityMap.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("calories");

        // 추천 음식 키워드 매핑
        List<String> keywords = getRecommendationKeywords(mostDeficient, gap);

        // 각 키워드로 음식 검색
        for (String keyword : keywords) {
            try {
                List<FoodResponse> foods = foodService.searchFoods(keyword).getFoods();
                if (!foods.isEmpty()) {
                    FoodResponse food = foods.get(0);

                    // 추천 섭취량 계산 (100g 기준)
                    double recommendedAmount = calculateRecommendedAmount(food, gap);

                    // 점수 계산
                    double score = calculateScore(food, gap, mostDeficient);

                    // 추천 이유
                    List<String> reasons = generateReasons(food, gap, mostDeficient);

                    recommendations.add(FoodRecommendationDto.builder()
                            .foodName(food.getName())
                            .recommendedAmount(recommendedAmount)
                            .calories(food.getCalories() * (recommendedAmount / 100.0))
                            .protein(food.getProtein() * (recommendedAmount / 100.0))
                            .carbs(food.getCarbs() * (recommendedAmount / 100.0))
                            .fat(food.getFat() * (recommendedAmount / 100.0))
                            .score(score)
                            .reasons(reasons)
                            .build());

                    if (recommendations.size() >= limit) {
                        break;
                    }
                }
            } catch (Exception e) {
                // 검색 실패 시 다음 키워드로
                continue;
            }
        }

        // 점수순으로 정렬
        return recommendations.stream()
                .sorted(Comparator.comparingDouble(FoodRecommendationDto::getScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<String> getRecommendationKeywords(String mostDeficient, NutritionGapDto gap) {
        List<String> keywords = new ArrayList<>();

        if ("protein".equals(mostDeficient)) {
            keywords.add("닭가슴살");
            keywords.add("계란");
            keywords.add("두부");
            keywords.add("연어");
        } else if ("carbs".equals(mostDeficient)) {
            keywords.add("밥");
            keywords.add("고구마");
            keywords.add("감자");
            keywords.add("현미");
        } else {
            // 칼로리 부족 시 균형 잡힌 음식
            keywords.add("샐러드");
            keywords.add("김밥");
            keywords.add("샌드위치");
            keywords.add("요거트");
        }

        return keywords;
    }

    private double calculateRecommendedAmount(FoodResponse food, NutritionGapDto gap) {
        // 간단한 로직: 칼로리 갭의 1/3을 이 음식으로 채운다고 가정
        if (food.getCalories() == null || food.getCalories() == 0) {
            return 100.0; // 기본값
        }

        double targetCalories = Math.max(gap.getCalories() / 3.0, 100);
        double amount = (targetCalories / food.getCalories()) * 100.0;

        // 50g ~ 300g 범위로 제한
        return Math.max(50.0, Math.min(300.0, amount));
    }

    private double calculateScore(FoodResponse food, NutritionGapDto gap, String mostDeficient) {
        double score = 50.0; // 기본 점수

        // 부족한 영양소를 많이 포함할수록 높은 점수
        if ("protein".equals(mostDeficient) && food.getProtein() != null) {
            score += Math.min(30.0, food.getProtein() * 2);
        } else if ("carbs".equals(mostDeficient) && food.getCarbs() != null) {
            score += Math.min(30.0, food.getCarbs());
        }

        // 칼로리 적정성
        if (food.getCalories() != null && food.getCalories() > 0 && food.getCalories() < 300) {
            score += 10.0;
        }

        // 균형 잡힌 영양소 (단백질:탄수화물:지방 비율)
        if (food.getProtein() != null && food.getCarbs() != null && food.getFat() != null) {
            score += 10.0;
        }

        return Math.min(100.0, score);
    }

    private List<String> generateReasons(FoodResponse food, NutritionGapDto gap, String mostDeficient) {
        List<String> reasons = new ArrayList<>();

        if ("protein".equals(mostDeficient)) {
            reasons.add("단백질 보충");
            if (food.getCalories() != null && food.getCalories() < 200) {
                reasons.add("저칼로리");
            }
        } else if ("carbs".equals(mostDeficient)) {
            reasons.add("탄수화물 보충");
            reasons.add("에너지 공급");
        } else {
            reasons.add("균형 잡힌 영양");
        }

        if (food.getFat() != null && food.getFat() < 5.0) {
            reasons.add("저지방");
        }

        return reasons;
    }

    private String generateCoachText(NutritionGapDto gap, List<FoodRecommendationDto> recommendations) {
        StringBuilder text = new StringBuilder();

        // 가장 부족한 영양소 찾기
        Map<String, Double> gaps = new HashMap<>();
        gaps.put("칼로리", gap.getCalories());
        gaps.put("단백질", gap.getProtein());
        gaps.put("탄수화물", gap.getCarbs());
        gaps.put("지방", gap.getFat());

        Map.Entry<String, Double> maxGap = gaps.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (maxGap != null) {
            if ("단백질".equals(maxGap.getKey())) {
                text.append(String.format("단백질이 %.1fg 부족해요. ", maxGap.getValue()));
            } else if ("탄수화물".equals(maxGap.getKey())) {
                text.append(String.format("탄수화물이 %.1fg 부족해요. ", maxGap.getValue()));
            } else if ("칼로리".equals(maxGap.getKey())) {
                text.append(String.format("칼로리가 %.0fkcal 부족해요. ", maxGap.getValue()));
            }
        } else {
            text.append("목표 섭취량을 달성했어요! ");
        }

        // 추천 음식 언급
        if (!recommendations.isEmpty()) {
            text.append(recommendations.get(0).getFoodName()).append("를 추천드려요!");
        }

        return text.toString();
    }
}
