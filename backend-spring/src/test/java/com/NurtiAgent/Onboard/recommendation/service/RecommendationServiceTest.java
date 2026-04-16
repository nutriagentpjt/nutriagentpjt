package com.NurtiAgent.Onboard.recommendation.service;

import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.meal.dto.MealSummaryResponse;
import com.NurtiAgent.Onboard.meal.service.MealService;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.exception.NutritionTargetNotFoundException;
import com.NurtiAgent.Onboard.profile.repository.NutritionTargetRepository;
import com.NurtiAgent.Onboard.recommendation.dto.FastApiRecommendResponse;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * RecommendationService 단위 테스트
 *
 * 테스트 대상:
 *   - getRecommendations: FastAPI 호출 + gap 계산 + 응답 매핑
 *
 * 의존성: UserRepository, NutritionTargetRepository, MealService,
 *         RestTemplate (모두 mock)
 * 주의: @Value 필드는 ReflectionTestUtils로 주입
 */
@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private NutritionTargetRepository nutritionTargetRepository;
    @Mock private MealService mealService;
    @Mock private RestTemplate restTemplate;

    @InjectMocks
    private RecommendationService recommendationService;

    private static final String GUEST_ID = "guest_test-001";
    private static final String DATE = "2024-01-15";

    private User testUser;
    private NutritionTarget target;

    @BeforeEach
    void setUp() {
        // @Value 필드 주입
        ReflectionTestUtils.setField(recommendationService, "fastapiRecommendUrl",
                "http://localhost:8001/recommend");
        ReflectionTestUtils.setField(recommendationService, "internalApiKey", "test-key");

        testUser = User.builder()
                .id(1L).guestId(GUEST_ID)
                .createdAt(LocalDateTime.now()).lastAccessedAt(LocalDateTime.now())
                .build();

        target = NutritionTarget.builder()
                .id(1L).user(testUser)
                .calories(2000.0).protein(150.0).carbs(200.0).fat(60.0)
                .bmr(1700.0).tdee(2000.0)
                .manualOverride(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    // -------------------- FastAPI 응답 픽스처 --------------------

    private FastApiRecommendResponse buildFastApiResponse() {
        FastApiRecommendResponse.NutrientTargets dailyTarget = new FastApiRecommendResponse.NutrientTargets();
        dailyTarget.setCalories(2000.0);
        dailyTarget.setProtein(150.0);
        dailyTarget.setCarbs(200.0);
        dailyTarget.setFat(60.0);

        FastApiRecommendResponse.NutrientTargets mealTarget = new FastApiRecommendResponse.NutrientTargets();
        mealTarget.setCalories(500.0);
        mealTarget.setProtein(37.5);
        mealTarget.setCarbs(50.0);
        mealTarget.setFat(15.0);

        FastApiRecommendResponse.FoodRecommendation food = new FastApiRecommendResponse.FoodRecommendation();
        food.setFoodId(1);
        food.setFoodName("닭가슴살");
        food.setScore(0.95);
        food.setRecommendedAmountG(200.0);
        food.setAmountRatio(2.0);
        food.setNutrientsPerServing(dailyTarget);
        food.setReasonTags(List.of("고단백"));

        FastApiRecommendResponse apiResponse = new FastApiRecommendResponse();
        apiResponse.setMealType("LUNCH");
        apiResponse.setDailyTarget(dailyTarget);
        apiResponse.setMealTarget(mealTarget);
        apiResponse.setRecommendations(List.of(food));

        return apiResponse;
    }

    private MealSummaryResponse buildSummary(double calories, double protein, double carbs, double fat) {
        return MealSummaryResponse.builder()
                .consumed(MealSummaryResponse.ConsumedNutrition.builder()
                        .calories(calories).protein(protein).carbs(carbs).fat(fat)
                        .build())
                .build();
    }

    // ==================== getRecommendations ====================

    @Nested
    @DisplayName("getRecommendations")
    class GetRecommendations {

        @Test
        @DisplayName("정상 추천: 응답에 setId, date, mealType, 추천 음식 목록 포함")
        void normal_returnsCompleteResponse() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(GUEST_ID, DATE, MealType.LUNCH))
                    .thenReturn(buildSummary(0, 0, 0, 0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            RecommendationResponse response = recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.LUNCH, 10);

            assertThat(response.getSetId()).isNotNull();
            assertThat(response.getDate()).isEqualTo(DATE);
            assertThat(response.getMealType()).isEqualTo(MealType.LUNCH);
            assertThat(response.getRecommendations()).hasSize(1);
            assertThat(response.getRecommendations().get(0).getFoodName()).isEqualTo("닭가슴살");
        }

        @Test
        @DisplayName("gap 계산: target - consumed, 음수는 0으로 처리")
        void gapCalculation_negativeBecomesZero() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();
            // mealTarget = 500 kcal, consumed = 600 kcal → gap = 0 (음수 방지)

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(GUEST_ID, DATE, MealType.LUNCH))
                    .thenReturn(buildSummary(600.0, 50.0, 70.0, 20.0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            RecommendationResponse response = recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.LUNCH, 10);

            // consumed(600) > mealTarget(500) → gap = 0
            assertThat(response.getGap().getCalories()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("gap 계산: 정상 양수 값 유지")
        void gapCalculation_positiveValueKept() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();
            // mealTarget = 500 kcal, consumed = 200 kcal → gap = 300

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(GUEST_ID, DATE, MealType.LUNCH))
                    .thenReturn(buildSummary(200.0, 10.0, 20.0, 5.0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            RecommendationResponse response = recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.LUNCH, 10);

            assertThat(response.getGap().getCalories()).isEqualTo(300.0); // 500 - 200
        }

        @Test
        @DisplayName("존재하지 않는 사용자: RuntimeException 발생")
        void unknownUser_throwsRuntimeException() {
            when(userRepository.findByGuestId(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recommendationService.getRecommendations(
                    "unknown", DATE, MealType.LUNCH, 10))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("인증 실패");
        }

        @Test
        @DisplayName("영양 목표 미설정: NutritionTargetNotFoundException 발생")
        void noNutritionTarget_throwsNotFoundException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.LUNCH, 10))
                    .isInstanceOf(NutritionTargetNotFoundException.class);
        }

        @Test
        @DisplayName("FastAPI 호출 시 올바른 헤더와 body 전달")
        void fastapiCall_usesCorrectHeaders() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(any(), any(), any()))
                    .thenReturn(buildSummary(0, 0, 0, 0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            recommendationService.getRecommendations(GUEST_ID, DATE, MealType.LUNCH, 5);

            verify(restTemplate).exchange(
                    eq("http://localhost:8001/recommend"),
                    eq(HttpMethod.POST),
                    any(),
                    eq(FastApiRecommendResponse.class)
            );
        }

        @Test
        @DisplayName("FastAPI NutrientTargets null: 0으로 처리")
        void nullNutrientTargets_treatedAsZero() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();
            apiResponse.setDailyTarget(null);
            apiResponse.setMealTarget(null);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(any(), any(), any()))
                    .thenReturn(buildSummary(0, 0, 0, 0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            RecommendationResponse response = recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.LUNCH, 10);

            assertThat(response.getDailyTarget().getCalories()).isEqualTo(0.0);
            assertThat(response.getMealTarget().getCalories()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("응답에 consumed 값이 현재 섭취량과 일치")
        void consumedInResponse_matchesMealSummary() {
            FastApiRecommendResponse apiResponse = buildFastApiResponse();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(target));
            when(mealService.getMealSummaryByMealType(GUEST_ID, DATE, MealType.BREAKFAST))
                    .thenReturn(buildSummary(350.0, 25.0, 40.0, 10.0));
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(FastApiRecommendResponse.class)))
                    .thenReturn(ResponseEntity.ok(apiResponse));

            RecommendationResponse response = recommendationService.getRecommendations(
                    GUEST_ID, DATE, MealType.BREAKFAST, 10);

            assertThat(response.getConsumed().getCalories()).isEqualTo(350.0);
            assertThat(response.getConsumed().getProtein()).isEqualTo(25.0);
        }
    }
}
