package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.common.enums.MealSource;
import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.meal.dto.*;
import com.NurtiAgent.Onboard.meal.entity.Meal;
import com.NurtiAgent.Onboard.meal.repository.MealRepository;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import com.NurtiAgent.Onboard.profile.repository.NutritionTargetRepository;
import com.NurtiAgent.Onboard.profile.repository.UserProfileRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * MealService 단위 테스트
 *
 * 테스트 대상:
 *   - createMeal
 *   - getMealsByDate
 *   - updateMeal
 *   - deleteMeal
 *   - getMealSummary / getMealSummaryByMealType
 *
 * 의존성: MealRepository, FoodService, UserRepository,
 *         UserProfileRepository, NutritionTargetRepository (모두 mock)
 */
@ExtendWith(MockitoExtension.class)
class MealServiceTest {

    @Mock private MealRepository mealRepository;
    @Mock private FoodService foodService;
    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private NutritionTargetRepository nutritionTargetRepository;

    @InjectMocks
    private MealService mealService;

    // -------------------- 공통 픽스처 --------------------

    private static final String GUEST_ID = "guest_test-001";

    private User testUser;
    private FoodResponse chickenFood;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .guestId(GUEST_ID)
                .createdAt(LocalDateTime.now())
                .lastAccessedAt(LocalDateTime.now())
                .build();

        chickenFood = FoodResponse.builder()
                .name("닭가슴살")
                .calories(165.0)
                .protein(31.0)
                .carbs(0.0)
                .fat(3.6)
                .build();
    }

    private Meal buildSavedMeal(Long id, double amount, LocalDate date, MealType type) {
        return Meal.builder()
                .id(id)
                .user(testUser)
                .foodName("닭가슴살")
                .amount(amount)
                .calories(165.0 * amount / 100.0)
                .protein(31.0 * amount / 100.0)
                .carbs(0.0)
                .fat(3.6 * amount / 100.0)
                .mealType(type)
                .date(date)
                .source(MealSource.MANUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== createMeal ====================

    @Nested
    @DisplayName("createMeal")
    class CreateMeal {

        @Test
        @DisplayName("정상 등록: 영양소가 amount 비율로 계산됨")
        void normalCreate_calculatesNutrientsProportionally() {
            LocalDate today = LocalDate.now();
            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살")
                    .amount(200.0)  // 100g 기준의 2배
                    .mealType(MealType.LUNCH)
                    .date(today)
                    .source(MealSource.MANUAL)
                    .build();

            Meal savedMeal = buildSavedMeal(1L, 200.0, today, MealType.LUNCH);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName("닭가슴살")).thenReturn(chickenFood);
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealResponse response = mealService.createMeal(GUEST_ID, request);

            assertThat(response.getCalories()).isEqualTo(165.0 * 2);   // 200g = 2배
            assertThat(response.getProtein()).isEqualTo(31.0 * 2);
            assertThat(response.getMealType()).isEqualTo(MealType.LUNCH);
        }

        @Test
        @DisplayName("존재하지 않는 사용자: RuntimeException 발생")
        void unknownGuestId_throwsRuntimeException() {
            when(userRepository.findByGuestId(any())).thenReturn(Optional.empty());

            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살").amount(100.0)
                    .mealType(MealType.LUNCH).date(LocalDate.now())
                    .build();

            assertThatThrownBy(() -> mealService.createMeal("unknown-id", request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("인증 실패");
        }

        @Test
        @DisplayName("존재하지 않는 음식: FoodNotFoundException 전파됨")
        void unknownFood_throwsFoodNotFoundException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName("없는음식")).thenThrow(new FoodNotFoundException("없는음식"));

            MealRequest request = MealRequest.builder()
                    .foodName("없는음식").amount(100.0)
                    .mealType(MealType.LUNCH).date(LocalDate.now())
                    .build();

            assertThatThrownBy(() -> mealService.createMeal(GUEST_ID, request))
                    .isInstanceOf(FoodNotFoundException.class);
        }

        @Test
        @DisplayName("31일 전 날짜: IllegalArgumentException 발생")
        void dateOlderThan30Days_throwsIllegalArgument() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName(any())).thenReturn(chickenFood);

            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살").amount(100.0)
                    .mealType(MealType.LUNCH)
                    .date(LocalDate.now().minusDays(31))
                    .build();

            assertThatThrownBy(() -> mealService.createMeal(GUEST_ID, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("30일");
        }

        @Test
        @DisplayName("미래 날짜: IllegalArgumentException 발생")
        void futureDate_throwsIllegalArgument() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName(any())).thenReturn(chickenFood);

            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살").amount(100.0)
                    .mealType(MealType.LUNCH)
                    .date(LocalDate.now().plusDays(1))
                    .build();

            assertThatThrownBy(() -> mealService.createMeal(GUEST_ID, request))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("오늘 날짜: 정상 등록")
        void todayDate_isValid() {
            Meal savedMeal = buildSavedMeal(1L, 100.0, LocalDate.now(), MealType.BREAKFAST);
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName(any())).thenReturn(chickenFood);
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살").amount(100.0)
                    .mealType(MealType.BREAKFAST).date(LocalDate.now())
                    .build();

            assertThat(mealService.createMeal(GUEST_ID, request)).isNotNull();
        }

        @Test
        @DisplayName("30일 전 날짜: 정상 등록 (경계값)")
        void exactlyThirtyDaysAgo_isValid() {
            LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
            Meal savedMeal = buildSavedMeal(1L, 100.0, thirtyDaysAgo, MealType.DINNER);
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName(any())).thenReturn(chickenFood);
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealRequest request = MealRequest.builder()
                    .foodName("닭가슴살").amount(100.0)
                    .mealType(MealType.DINNER).date(thirtyDaysAgo)
                    .build();

            assertThat(mealService.createMeal(GUEST_ID, request)).isNotNull();
        }

        @Test
        @DisplayName("음식의 영양소가 null인 경우 null로 저장")
        void nullNutrients_storedAsNull() {
            FoodResponse noNutrients = FoodResponse.builder()
                    .name("미상음식")
                    .calories(100.0)
                    .protein(null).carbs(null).fat(null)
                    .build();

            Meal savedMeal = Meal.builder()
                    .id(1L).user(testUser).foodName("미상음식")
                    .amount(100.0).calories(100.0)
                    .protein(null).carbs(null).fat(null)
                    .mealType(MealType.SNACK).date(LocalDate.now())
                    .source(MealSource.MANUAL)
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                    .build();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(foodService.getFoodByName("미상음식")).thenReturn(noNutrients);
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealRequest request = MealRequest.builder()
                    .foodName("미상음식").amount(100.0)
                    .mealType(MealType.SNACK).date(LocalDate.now())
                    .build();

            MealResponse response = mealService.createMeal(GUEST_ID, request);
            assertThat(response.getProtein()).isNull();
            assertThat(response.getCarbs()).isNull();
            assertThat(response.getFat()).isNull();
        }
    }

    // ==================== getMealsByDate ====================

    @Nested
    @DisplayName("getMealsByDate")
    class GetMealsByDate {

        @Test
        @DisplayName("해당 날짜 식사 없음: 빈 목록 + 총합 0")
        void noMealsOnDate_returnsEmptyWithZeroTotals() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDateOrderByCreatedAtAsc(any(), any())).thenReturn(List.of());
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.empty());

            MealListResponse response = mealService.getMealsByDate(GUEST_ID, "2024-01-15");

            assertThat(response.getMeals()).isEmpty();
            assertThat(response.getSummary().getTotalCalories()).isEqualTo(0.0);
            assertThat(response.getSummary().getTotalProtein()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("여러 식사 기록: 영양소 합계 정확히 계산")
        void multipleMeals_aggregatesNutrition() {
            LocalDate date = LocalDate.now();
            Meal meal1 = buildSavedMeal(1L, 100.0, date, MealType.BREAKFAST);
            Meal meal2 = buildSavedMeal(2L, 200.0, date, MealType.LUNCH);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDateOrderByCreatedAtAsc(any(), any()))
                    .thenReturn(List.of(meal1, meal2));
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.empty());

            MealListResponse response = mealService.getMealsByDate(GUEST_ID, date.toString());

            double expectedCalories = meal1.getCalories() + meal2.getCalories();
            assertThat(response.getMeals()).hasSize(2);
            assertThat(response.getSummary().getTotalCalories()).isEqualTo(expectedCalories);
        }

        @Test
        @DisplayName("온보딩 완료 + 영양 목표 있음: 달성률 계산됨")
        void onboardedUserWithTarget_calculatesAchievement() {
            LocalDate date = LocalDate.now();
            Meal meal = buildSavedMeal(1L, 100.0, date, MealType.LUNCH);

            UserProfile profile = UserProfile.builder()
                    .onboardingCompleted(true).build();
            NutritionTarget target = NutritionTarget.builder()
                    .calories(2000.0).protein(150.0).carbs(200.0).fat(60.0)
                    .manualOverride(false).build();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDateOrderByCreatedAtAsc(any(), any())).thenReturn(List.of(meal));
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.of(profile));
            when(nutritionTargetRepository.findByUser(any())).thenReturn(Optional.of(target));

            MealListResponse response = mealService.getMealsByDate(GUEST_ID, date.toString());

            assertThat(response.getSummary().getCaloriesAchievement()).isGreaterThan(0.0);
            assertThat(response.getSummary().getTargetCalories()).isEqualTo(2000.0);
        }

        @Test
        @DisplayName("온보딩 미완료: 목표 및 달성률 null")
        void notOnboarded_noTargetOrAchievement() {
            LocalDate date = LocalDate.now();
            Meal meal = buildSavedMeal(1L, 100.0, date, MealType.LUNCH);

            UserProfile profile = UserProfile.builder()
                    .onboardingCompleted(false).build();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDateOrderByCreatedAtAsc(any(), any())).thenReturn(List.of(meal));
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.of(profile));

            MealListResponse response = mealService.getMealsByDate(GUEST_ID, date.toString());

            assertThat(response.getSummary().getTargetCalories()).isNull();
        }
    }

    // ==================== updateMeal ====================

    @Nested
    @DisplayName("updateMeal")
    class UpdateMeal {

        @Test
        @DisplayName("amount 변경: 영양소 재계산됨")
        void updateAmount_recalculatesNutrition() {
            LocalDate date = LocalDate.now();
            Meal existingMeal = buildSavedMeal(1L, 100.0, date, MealType.LUNCH);
            Meal savedMeal    = buildSavedMeal(1L, 300.0, date, MealType.LUNCH);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(existingMeal));
            when(foodService.getFoodByName("닭가슴살")).thenReturn(chickenFood);
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealUpdateRequest request = MealUpdateRequest.builder().amount(300.0).build();

            MealResponse response = mealService.updateMeal(GUEST_ID, 1L, request);
            assertThat(response.getAmount()).isEqualTo(300.0);
        }

        @Test
        @DisplayName("mealType만 변경: 음식 재조회 없음")
        void updateMealTypeOnly_noFoodServiceCall() {
            LocalDate date = LocalDate.now();
            Meal existingMeal = buildSavedMeal(1L, 100.0, date, MealType.LUNCH);
            Meal savedMeal    = buildSavedMeal(1L, 100.0, date, MealType.DINNER);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(existingMeal));
            when(mealRepository.save(any())).thenReturn(savedMeal);

            MealUpdateRequest request = MealUpdateRequest.builder().mealType(MealType.DINNER).build();
            mealService.updateMeal(GUEST_ID, 1L, request);

            verify(foodService, never()).getFoodByName(any());
        }

        @Test
        @DisplayName("존재하지 않는 meal: RuntimeException 발생")
        void notFoundMeal_throws() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(99L, testUser)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mealService.updateMeal(GUEST_ID, 99L, new MealUpdateRequest()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("찾을 수 없습니다");
        }

        @Test
        @DisplayName("31일 전 날짜로 변경: IllegalArgumentException 발생")
        void updateToOldDate_throws() {
            Meal existingMeal = buildSavedMeal(1L, 100.0, LocalDate.now(), MealType.LUNCH);
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(existingMeal));

            MealUpdateRequest request = MealUpdateRequest.builder()
                    .date(LocalDate.now().minusDays(31)).build();

            assertThatThrownBy(() -> mealService.updateMeal(GUEST_ID, 1L, request))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ==================== deleteMeal ====================

    @Nested
    @DisplayName("deleteMeal")
    class DeleteMeal {

        @Test
        @DisplayName("정상 삭제: success=true 반환")
        void normalDelete_returnsSuccess() {
            Meal meal = buildSavedMeal(1L, 100.0, LocalDate.now(), MealType.LUNCH);
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(1L, testUser)).thenReturn(Optional.of(meal));

            MealDeleteResponse response = mealService.deleteMeal(GUEST_ID, 1L);

            assertThat(response.getSuccess()).isTrue();
            verify(mealRepository).delete(meal);
        }

        @Test
        @DisplayName("존재하지 않는 meal 삭제: RuntimeException 발생")
        void notFoundMeal_throws() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByIdAndUser(99L, testUser)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mealService.deleteMeal(GUEST_ID, 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("찾을 수 없습니다");
            verify(mealRepository, never()).delete(any());
        }
    }

    // ==================== getMealSummary ====================

    @Nested
    @DisplayName("getMealSummary / getMealSummaryByMealType")
    class GetMealSummary {

        @Test
        @DisplayName("하루 식단 합계 계산")
        void dailySummary_aggregatesAll() {
            LocalDate date = LocalDate.now();
            Meal m1 = buildSavedMeal(1L, 100.0, date, MealType.BREAKFAST);
            Meal m2 = buildSavedMeal(2L, 150.0, date, MealType.LUNCH);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDate(any(), eq(date))).thenReturn(List.of(m1, m2));

            MealSummaryResponse summary = mealService.getMealSummary(GUEST_ID, date.toString());

            assertThat(summary.getConsumed().getCalories())
                    .isEqualTo(m1.getCalories() + m2.getCalories());
        }

        @Test
        @DisplayName("식사 유형별 합계 계산")
        void summaryByMealType_filtersByType() {
            LocalDate date = LocalDate.now();
            Meal breakfast = buildSavedMeal(1L, 100.0, date, MealType.BREAKFAST);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDateAndMealType(any(), eq(date), eq(MealType.BREAKFAST)))
                    .thenReturn(List.of(breakfast));

            MealSummaryResponse summary = mealService.getMealSummaryByMealType(
                    GUEST_ID, date.toString(), MealType.BREAKFAST);

            assertThat(summary.getConsumed().getCalories()).isEqualTo(breakfast.getCalories());
        }

        @Test
        @DisplayName("식사 없는 날: 모든 영양소 합계 0")
        void noMeals_allZeros() {
            LocalDate date = LocalDate.now();
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDate(any(), any())).thenReturn(List.of());

            MealSummaryResponse summary = mealService.getMealSummary(GUEST_ID, date.toString());

            assertThat(summary.getConsumed().getCalories()).isEqualTo(0.0);
            assertThat(summary.getConsumed().getProtein()).isEqualTo(0.0);
            assertThat(summary.getConsumed().getCarbs()).isEqualTo(0.0);
            assertThat(summary.getConsumed().getFat()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("protein이 null인 식사: 합계 계산 시 무시됨 (0으로 처리)")
        void nullProteinMeals_ignoredInSum() {
            LocalDate date = LocalDate.now();
            Meal noProtein = Meal.builder()
                    .id(1L).user(testUser).foodName("테스트")
                    .amount(100.0).calories(100.0)
                    .protein(null).carbs(null).fat(null)
                    .mealType(MealType.SNACK).date(date)
                    .source(MealSource.MANUAL)
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                    .build();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(mealRepository.findByUserAndDate(any(), any())).thenReturn(List.of(noProtein));

            MealSummaryResponse summary = mealService.getMealSummary(GUEST_ID, date.toString());

            assertThat(summary.getConsumed().getCalories()).isEqualTo(100.0);
            assertThat(summary.getConsumed().getProtein()).isEqualTo(0.0);
        }
    }
}
