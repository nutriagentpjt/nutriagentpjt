package com.NurtiAgent.Onboard.recommendation.service;

import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.meal.dto.MealSummaryResponse;
import com.NurtiAgent.Onboard.meal.service.MealService;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.exception.NutritionTargetNotFoundException;
import com.NurtiAgent.Onboard.profile.repository.NutritionTargetRepository;
import com.NurtiAgent.Onboard.recommendation.dto.FastApiRecommendResponse;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse.FoodRecommendationDto;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse.NutritionDto;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse.ScoreBreakdownDto;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final MealService mealService;
    private final NutritionTargetRepository nutritionTargetRepository;
    private final RestTemplate restTemplate;

    @Value("${fastapi.recommend.url}")
    private String fastapiRecommendUrl;

    @Value("${fastapi.internal-key}")
    private String internalApiKey;

    @Transactional(readOnly = true)
    public RecommendationResponse getRecommendations(String guestId, String date, MealType mealType, Integer limit) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        NutritionTarget target = nutritionTargetRepository.findByUser(user)
                .orElseThrow(() -> new NutritionTargetNotFoundException("목표 영양소가 설정되지 않았습니다. 온보딩을 먼저 완료해주세요."));

        // 오늘 해당 끼니 섭취량 조회
        MealSummaryResponse summary = mealService.getMealSummaryByMealType(guestId, date, mealType);
        NutritionDto consumed = NutritionDto.builder()
                .calories(summary.getConsumed().getCalories())
                .protein(summary.getConsumed().getProtein())
                .carbs(summary.getConsumed().getCarbs())
                .fat(summary.getConsumed().getFat())
                .build();

        // FastAPI 호출
        FastApiRecommendResponse fastapiResponse = callFastapiRecommend(guestId, mealType, limit);

        // FastAPI 응답 매핑
        NutritionDto dailyTarget = toNutritionDto(fastapiResponse.getDailyTarget());
        NutritionDto mealTarget = toNutritionDto(fastapiResponse.getMealTarget());

        NutritionDto gap = NutritionDto.builder()
                .calories(Math.max(mealTarget.getCalories() - consumed.getCalories(), 0))
                .protein(Math.max(mealTarget.getProtein() - consumed.getProtein(), 0))
                .carbs(Math.max(mealTarget.getCarbs() - consumed.getCarbs(), 0))
                .fat(Math.max(mealTarget.getFat() - consumed.getFat(), 0))
                .build();

        List<FoodRecommendationDto> recommendations = fastapiResponse.getRecommendations().stream()
                .map(this::toFoodRecommendationDto)
                .collect(Collectors.toList());

        return RecommendationResponse.builder()
                .setId(UUID.randomUUID().toString())
                .date(date)
                .mealType(mealType)
                .dailyTarget(dailyTarget)
                .mealTarget(mealTarget)
                .consumed(consumed)
                .gap(gap)
                .recommendations(recommendations)
                .build();
    }

    private FastApiRecommendResponse callFastapiRecommend(String guestId, MealType mealType, int topN) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Key", internalApiKey);
        headers.set("Content-Type", "application/json");

        Map<String, Object> body = Map.of(
                "guest_id", guestId,
                "meal_type", mealType.name(),
                "top_n", topN
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<FastApiRecommendResponse> response = restTemplate.exchange(
                fastapiRecommendUrl,
                HttpMethod.POST,
                request,
                FastApiRecommendResponse.class
        );

        return response.getBody();
    }

    private NutritionDto toNutritionDto(FastApiRecommendResponse.NutrientTargets src) {
        if (src == null) return NutritionDto.builder().calories(0.0).protein(0.0).carbs(0.0).fat(0.0).build();
        return NutritionDto.builder()
                .calories(src.getCalories())
                .protein(src.getProtein())
                .carbs(src.getCarbs())
                .fat(src.getFat())
                .build();
    }

    private FoodRecommendationDto toFoodRecommendationDto(FastApiRecommendResponse.FoodRecommendation src) {
        ScoreBreakdownDto breakdown = null;
        if (src.getScoreBreakdown() != null) {
            FastApiRecommendResponse.ScoreBreakdown sb = src.getScoreBreakdown();
            breakdown = ScoreBreakdownDto.builder()
                    .gapMatch(sb.getGapMatch())
                    .goalAlignment(sb.getGoalAlignment())
                    .diseaseCompliance(sb.getDiseaseCompliance())
                    .preference(sb.getPreference())
                    .feedback(sb.getFeedback())
                    .build();
        }

        NutritionDto nutrients = toNutritionDto(src.getNutrientsPerServing());

        return FoodRecommendationDto.builder()
                .foodId(src.getFoodId())
                .foodName(src.getFoodName())
                .score(src.getScore())
                .scoreBreakdown(breakdown)
                .recommendedAmountG(src.getRecommendedAmountG())
                .amountRatio(src.getAmountRatio())
                .nutrientsPerServing(nutrients)
                .reasonTags(src.getReasonTags())
                .build();
    }
}
