package com.NurtiAgent.Onboard.preference.service;

import com.NurtiAgent.Onboard.common.enums.DietStyle;
import com.NurtiAgent.Onboard.common.enums.FoodType;
import com.NurtiAgent.Onboard.common.enums.MealPattern;
import com.NurtiAgent.Onboard.common.exception.DuplicateFoodException;
import com.NurtiAgent.Onboard.preference.dto.AddFoodRequest;
import com.NurtiAgent.Onboard.preference.dto.PreferenceResponse;
import com.NurtiAgent.Onboard.preference.dto.PreferenceUpdateRequest;
import com.NurtiAgent.Onboard.preference.dto.RemoveFoodRequest;
import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import com.NurtiAgent.Onboard.profile.repository.DietaryPreferenceRepository;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PreferenceService 단위 테스트
 *
 * 테스트 대상:
 *   - addFood (PREFERRED / DISLIKED)
 *   - removeFood (PREFERRED / DISLIKED)
 *   - getPreferences
 *   - updatePreferences (부분 업데이트)
 *
 * 의존성: UserRepository, DietaryPreferenceRepository (mock)
 */
@ExtendWith(MockitoExtension.class)
class PreferenceServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private DietaryPreferenceRepository dietaryPreferenceRepository;

    @InjectMocks
    private PreferenceService preferenceService;

    // -------------------- 공통 픽스처 --------------------

    private static final String GUEST_ID = "guest_test-001";

    private User testUser;
    private DietaryPreference preference;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L).guestId(GUEST_ID)
                .createdAt(LocalDateTime.now()).lastAccessedAt(LocalDateTime.now())
                .build();

        // 수정 가능한 리스트로 초기화
        preference = DietaryPreference.builder()
                .id(1L).user(testUser)
                .mealPattern(MealPattern.THREE_MEALS)
                .preferredFoods(new ArrayList<>(List.of("닭가슴살")))
                .dislikedFoods(new ArrayList<>(List.of(
                        new DietaryPreference.DislikedFoodItem("두부", "DISLIKE"))))
                .allergies(new ArrayList<>())
                .dietStyles(new ArrayList<>())
                .waterIntakeGoal(2.0)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== addFood ====================

    @Nested
    @DisplayName("addFood")
    class AddFood {

        @Test
        @DisplayName("선호 음식 정상 추가")
        void addPreferredFood_success() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("현미밥").type(FoodType.PREFERRED).build();

            preferenceService.addFood(GUEST_ID, request);

            assertThat(preference.getPreferredFoods()).contains("현미밥");
        }

        @Test
        @DisplayName("비선호 음식 정상 추가")
        void addDislikedFood_success() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("삼겹살").type(FoodType.DISLIKED).reason("DISLIKE").build();

            preferenceService.addFood(GUEST_ID, request);

            assertThat(preference.getDislikedFoods())
                    .anyMatch(item -> item.getFoodName().equals("삼겹살"));
        }

        @Test
        @DisplayName("이미 선호 음식에 있는 경우: DuplicateFoodException 발생")
        void duplicatePreferred_throwsDuplicateFoodException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("닭가슴살").type(FoodType.PREFERRED).build();

            assertThatThrownBy(() -> preferenceService.addFood(GUEST_ID, request))
                    .isInstanceOf(DuplicateFoodException.class)
                    .hasMessageContaining("닭가슴살");
        }

        @Test
        @DisplayName("비선호 음식에 있는 음식을 선호에 추가: DuplicateFoodException 발생")
        void addToPreferred_alreadyInDisliked_throwsDuplicateFoodException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            // "두부"는 이미 dislikedFoods에 있음
            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("두부").type(FoodType.PREFERRED).build();

            assertThatThrownBy(() -> preferenceService.addFood(GUEST_ID, request))
                    .isInstanceOf(DuplicateFoodException.class)
                    .hasMessageContaining("두부");
        }

        @Test
        @DisplayName("선호 음식에 있는 음식을 비선호에 추가: DuplicateFoodException 발생")
        void addToDisliked_alreadyInPreferred_throwsDuplicateFoodException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            // "닭가슴살"은 이미 preferredFoods에 있음
            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("닭가슴살").type(FoodType.DISLIKED).build();

            assertThatThrownBy(() -> preferenceService.addFood(GUEST_ID, request))
                    .isInstanceOf(DuplicateFoodException.class)
                    .hasMessageContaining("닭가슴살");
        }

        @Test
        @DisplayName("이미 비선호 음식에 있는 경우 중복 추가: DuplicateFoodException 발생")
        void duplicateDisliked_throwsDuplicateFoodException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            AddFoodRequest request = AddFoodRequest.builder()
                    .foodName("두부").type(FoodType.DISLIKED).build();

            assertThatThrownBy(() -> preferenceService.addFood(GUEST_ID, request))
                    .isInstanceOf(DuplicateFoodException.class);
        }

        @Test
        @DisplayName("사용자 없음: RuntimeException 발생")
        void unknownUser_throwsRuntimeException() {
            when(userRepository.findByGuestId(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> preferenceService.addFood("unknown",
                    AddFoodRequest.builder().foodName("닭").type(FoodType.PREFERRED).build()))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("인증 실패");
        }
    }

    // ==================== removeFood ====================

    @Nested
    @DisplayName("removeFood")
    class RemoveFood {

        @Test
        @DisplayName("선호 음식 정상 제거")
        void removePreferredFood_success() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            RemoveFoodRequest request = RemoveFoodRequest.builder()
                    .foodName("닭가슴살").type(FoodType.PREFERRED).build();

            preferenceService.removeFood(GUEST_ID, request);

            assertThat(preference.getPreferredFoods()).doesNotContain("닭가슴살");
        }

        @Test
        @DisplayName("비선호 음식 정상 제거")
        void removeDislikedFood_success() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            RemoveFoodRequest request = RemoveFoodRequest.builder()
                    .foodName("두부").type(FoodType.DISLIKED).build();

            preferenceService.removeFood(GUEST_ID, request);

            assertThat(preference.getDislikedFoods())
                    .noneMatch(item -> item.getFoodName().equals("두부"));
        }

        @Test
        @DisplayName("선호 목록에 없는 음식 제거: IllegalArgumentException 발생")
        void removeNonExistentPreferred_throwsIllegalArgument() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            RemoveFoodRequest request = RemoveFoodRequest.builder()
                    .foodName("없는음식").type(FoodType.PREFERRED).build();

            assertThatThrownBy(() -> preferenceService.removeFood(GUEST_ID, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("없는음식");
        }

        @Test
        @DisplayName("비선호 목록에 없는 음식 제거: IllegalArgumentException 발생")
        void removeNonExistentDisliked_throwsIllegalArgument() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            RemoveFoodRequest request = RemoveFoodRequest.builder()
                    .foodName("없는음식").type(FoodType.DISLIKED).build();

            assertThatThrownBy(() -> preferenceService.removeFood(GUEST_ID, request))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ==================== getPreferences ====================

    @Nested
    @DisplayName("getPreferences")
    class GetPreferences {

        @Test
        @DisplayName("정상 조회: 응답 반환")
        void existingPreferences_returnsResponse() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));

            PreferenceResponse response = preferenceService.getPreferences(GUEST_ID);

            assertThat(response.getMealPattern()).isEqualTo(MealPattern.THREE_MEALS);
            assertThat(response.getPreferredFoods()).contains("닭가슴살");
        }

        @Test
        @DisplayName("식단 설정 없음: RuntimeException 발생")
        void noPreference_throwsRuntimeException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> preferenceService.getPreferences(GUEST_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("식단");
        }
    }

    // ==================== updatePreferences ====================

    @Nested
    @DisplayName("updatePreferences")
    class UpdatePreferences {

        @Test
        @DisplayName("mealPattern 업데이트")
        void updateMealPattern_isApplied() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .mealPattern(MealPattern.INTERMITTENT_FASTING).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getMealPattern()).isEqualTo(MealPattern.INTERMITTENT_FASTING);
        }

        @Test
        @DisplayName("allergies 전체 교체")
        void updateAllergies_fullReplace() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            List<String> newAllergies = List.of("땅콩", "우유");
            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .allergies(newAllergies).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getAllergies()).containsExactlyInAnyOrder("땅콩", "우유");
        }

        @Test
        @DisplayName("waterIntakeGoal 업데이트")
        void updateWaterIntake_isApplied() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .waterIntakeGoal(3.0).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getWaterIntakeGoal()).isEqualTo(3.0);
        }

        @Test
        @DisplayName("dietStyles 전체 교체")
        void updateDietStyles_fullReplace() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .dietStyles(List.of(DietStyle.KETO)).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getDietStyles()).containsExactly(DietStyle.KETO);
        }

        @Test
        @DisplayName("constraints 부분 업데이트: null 필드는 기존 값 유지")
        void updateConstraints_partialUpdate() {
            DietaryPreference.DietaryConstraints existing =
                    new DietaryPreference.DietaryConstraints(true, false, 600);
            preference.setConstraints(existing);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest.DietaryConstraintsDto constraintsDto =
                    new PreferenceUpdateRequest.DietaryConstraintsDto(null, true, null);
            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .constraints(constraintsDto).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getConstraints().getLowSodium()).isTrue();   // 기존 유지
            assertThat(preference.getConstraints().getLowSugar()).isTrue();    // 업데이트됨
            assertThat(preference.getConstraints().getMaxCaloriesPerMeal()).isEqualTo(600); // 기존 유지
        }

        @Test
        @DisplayName("constraints가 null인 상태에서 업데이트: 새로운 constraints 생성")
        void updateConstraints_nullExisting_createsNew() {
            preference.setConstraints(null);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest.DietaryConstraintsDto constraintsDto =
                    new PreferenceUpdateRequest.DietaryConstraintsDto(true, null, 500);
            PreferenceUpdateRequest request = PreferenceUpdateRequest.builder()
                    .constraints(constraintsDto).build();

            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getConstraints()).isNotNull();
            assertThat(preference.getConstraints().getLowSodium()).isTrue();
            assertThat(preference.getConstraints().getMaxCaloriesPerMeal()).isEqualTo(500);
        }

        @Test
        @DisplayName("모든 필드 null: 아무것도 변경되지 않음")
        void allNullRequest_nothingChanges() {
            MealPattern originalPattern = preference.getMealPattern();
            Double originalWater = preference.getWaterIntakeGoal();

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(preference));
            when(dietaryPreferenceRepository.save(any())).thenReturn(preference);

            PreferenceUpdateRequest request = new PreferenceUpdateRequest();
            preferenceService.updatePreferences(GUEST_ID, request);

            assertThat(preference.getMealPattern()).isEqualTo(originalPattern);
            assertThat(preference.getWaterIntakeGoal()).isEqualTo(originalWater);
        }
    }
}
