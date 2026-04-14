package com.NurtiAgent.Onboard.profile.service;

import com.NurtiAgent.Onboard.common.enums.*;
import com.NurtiAgent.Onboard.profile.dto.*;
import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import com.NurtiAgent.Onboard.profile.repository.DietaryPreferenceRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ProfileService 단위 테스트
 *
 * 테스트 대상:
 *   - saveOnboarding
 *   - getProfile
 *   - updateProfile
 *   - getNutritionTargets
 *   - updateNutritionTargets
 *
 * 의존성: UserRepository, UserProfileRepository, DietaryPreferenceRepository,
 *         NutritionTargetRepository, NutritionCalculatorService (모두 mock)
 */
@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private DietaryPreferenceRepository dietaryPreferenceRepository;
    @Mock private NutritionTargetRepository nutritionTargetRepository;
    @Mock private NutritionCalculatorService nutritionCalculatorService;

    @InjectMocks
    private ProfileService profileService;

    // -------------------- 공통 픽스처 --------------------

    private static final String GUEST_ID = "guest_test-001";

    private User testUser;
    private UserProfile testProfile;
    private DietaryPreference testPreference;
    private NutritionTarget testTarget;
    private NutritionCalculatorService.NutritionResult nutritionResult;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L).guestId(GUEST_ID)
                .createdAt(LocalDateTime.now()).lastAccessedAt(LocalDateTime.now())
                .build();

        testProfile = UserProfile.builder()
                .id(1L).user(testUser)
                .age(30).gender(Gender.MALE)
                .height(175.0).weight(70.0)
                .healthGoal(HealthGoal.MAINTAIN)
                .activityLevel(ActivityLevel.MODERATELY_ACTIVE)
                .exerciseFrequency(3)
                .onboardingCompleted(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        testPreference = DietaryPreference.builder()
                .id(1L).user(testUser)
                .mealPattern(MealPattern.THREE_MEALS)
                .preferredFoods(List.of("닭가슴살"))
                .dislikedFoods(List.of())
                .allergies(List.of())
                .dietStyles(List.of())
                .updatedAt(LocalDateTime.now())
                .build();

        testTarget = NutritionTarget.builder()
                .id(1L).user(testUser)
                .calories(2200.0).protein(110.0).carbs(275.0).fat(73.0)
                .bmr(1700.0).tdee(2200.0)
                .manualOverride(false)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        nutritionResult = NutritionCalculatorService.NutritionResult.builder()
                .bmr(1700.0).tdee(2200.0).targetCalories(2200.0)
                .protein(110.0).carbs(275.0).fat(73.0)
                .build();
    }

    private OnboardingRequest buildOnboardingRequest(
            List<String> preferredFoods,
            List<OnboardingRequest.DislikedFoodDto> dislikedFoods) {
        return OnboardingRequest.builder()
                .age(30).gender(Gender.MALE)
                .height(175.0).weight(70.0)
                .healthGoal(HealthGoal.MAINTAIN)
                .activityLevel(ActivityLevel.MODERATELY_ACTIVE)
                .exerciseFrequency(3)
                .mealPattern(MealPattern.THREE_MEALS)
                .preferredFoods(preferredFoods)
                .dislikedFoods(dislikedFoods)
                .build();
    }

    // ==================== saveOnboarding ====================

    @Nested
    @DisplayName("saveOnboarding")
    class SaveOnboarding {

        @Test
        @DisplayName("정상 온보딩: 프로필, 선호도, 영양 목표가 저장되고 응답 반환")
        void normalOnboarding_savesAllEntitiesAndReturnsResponse() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.save(any())).thenReturn(testProfile);
            when(dietaryPreferenceRepository.save(any())).thenReturn(testPreference);
            when(nutritionCalculatorService.calculateNutritionTargets(any())).thenReturn(nutritionResult);
            when(nutritionTargetRepository.save(any())).thenReturn(testTarget);

            OnboardingRequest request = buildOnboardingRequest(
                    List.of("닭가슴살"), List.of());

            OnboardingResponse response = profileService.saveOnboarding(GUEST_ID, request);

            assertThat(response.getUserId()).isEqualTo(GUEST_ID);
            verify(userProfileRepository).save(any());
            verify(dietaryPreferenceRepository).save(any());
            verify(nutritionTargetRepository).save(any());
        }

        @Test
        @DisplayName("선호/비선호 음식 중복: IllegalArgumentException 발생")
        void duplicateFoodInPreferredAndDisliked_throwsIllegalArgument() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));

            List<OnboardingRequest.DislikedFoodDto> disliked =
                    List.of(new OnboardingRequest.DislikedFoodDto("닭가슴살", "DISLIKE"));

            OnboardingRequest request = buildOnboardingRequest(
                    List.of("닭가슴살"), disliked);

            assertThatThrownBy(() -> profileService.saveOnboarding(GUEST_ID, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("닭가슴살");
        }

        @Test
        @DisplayName("존재하지 않는 사용자: RuntimeException 발생")
        void unknownUser_throwsRuntimeException() {
            when(userRepository.findByGuestId(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.saveOnboarding("unknown", buildOnboardingRequest(null, null)))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("인증 실패");
        }

        @Test
        @DisplayName("diseases가 null일 때 빈 리스트로 저장됨")
        void nullDiseases_savedAsEmptyList() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.save(any())).thenReturn(testProfile);
            when(dietaryPreferenceRepository.save(any())).thenReturn(testPreference);
            when(nutritionCalculatorService.calculateNutritionTargets(any())).thenReturn(nutritionResult);
            when(nutritionTargetRepository.save(any())).thenReturn(testTarget);

            OnboardingRequest request = buildOnboardingRequest(null, null);
            request.setDiseases(null);

            profileService.saveOnboarding(GUEST_ID, request);

            verify(userProfileRepository).save(argThat(profile ->
                    profile.getDiseases() != null && profile.getDiseases().isEmpty()
            ));
        }

        @Test
        @DisplayName("선호/비선호 음식이 각각 다를 때: 정상 저장")
        void differentPreferredAndDislikedFoods_savesOk() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.save(any())).thenReturn(testProfile);
            when(dietaryPreferenceRepository.save(any())).thenReturn(testPreference);
            when(nutritionCalculatorService.calculateNutritionTargets(any())).thenReturn(nutritionResult);
            when(nutritionTargetRepository.save(any())).thenReturn(testTarget);

            List<OnboardingRequest.DislikedFoodDto> disliked =
                    List.of(new OnboardingRequest.DislikedFoodDto("두부", "DISLIKE"));
            OnboardingRequest request = buildOnboardingRequest(List.of("닭가슴살"), disliked);

            assertThat(profileService.saveOnboarding(GUEST_ID, request)).isNotNull();
        }
    }

    // ==================== getProfile ====================

    @Nested
    @DisplayName("getProfile")
    class GetProfile {

        @Test
        @DisplayName("정상 조회: 프로필 응답 반환")
        void existingProfile_returnsResponse() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(testPreference));

            ProfileResponse response = profileService.getProfile(GUEST_ID);

            assertThat(response.getUserId()).isEqualTo(GUEST_ID);
            assertThat(response.getAge()).isEqualTo(30);
        }

        @Test
        @DisplayName("프로필 없음: RuntimeException 발생")
        void noProfile_throwsRuntimeException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getProfile(GUEST_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("프로필");
        }

        @Test
        @DisplayName("식단 설정 없음: RuntimeException 발생")
        void noDietaryPreference_throwsRuntimeException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(any())).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getProfile(GUEST_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("식단");
        }
    }

    // ==================== updateProfile ====================

    @Nested
    @DisplayName("updateProfile")
    class UpdateProfile {

        @Test
        @DisplayName("물리 파라미터 변경 → 영양 목표 재계산됨 (manualOverride=false)")
        void physicalParamChange_triggersRecalculation() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(testPreference));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(testTarget));
            when(userProfileRepository.save(any())).thenReturn(testProfile);
            when(nutritionCalculatorService.calculateNutritionTargets(any())).thenReturn(nutritionResult);

            ProfileUpdateRequest request = ProfileUpdateRequest.builder().weight(75.0).build();
            profileService.updateProfile(GUEST_ID, request);

            verify(nutritionCalculatorService).calculateNutritionTargets(any());
            verify(nutritionTargetRepository).save(any());
        }

        @Test
        @DisplayName("manualOverride=true: 재계산 스킵됨")
        void manualOverride_skipsRecalculation() {
            testTarget.setManualOverride(true);

            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(testPreference));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(testTarget));
            when(userProfileRepository.save(any())).thenReturn(testProfile);

            ProfileUpdateRequest request = ProfileUpdateRequest.builder().weight(80.0).build();
            profileService.updateProfile(GUEST_ID, request);

            verify(nutritionCalculatorService, never()).calculateNutritionTargets(any());
        }

        @Test
        @DisplayName("exerciseFrequency만 변경 → 영양 재계산 없음")
        void onlyExerciseFrequencyChange_noRecalculation() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(testPreference));
            when(userProfileRepository.save(any())).thenReturn(testProfile);

            ProfileUpdateRequest request = ProfileUpdateRequest.builder().exerciseFrequency(5).build();
            profileService.updateProfile(GUEST_ID, request);

            verify(nutritionCalculatorService, never()).calculateNutritionTargets(any());
        }

        @Test
        @DisplayName("영양 목표가 없는 상태에서 재계산: 새로운 목표 생성")
        void noExistingTarget_createsNewTarget() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(userProfileRepository.findByUser(testUser)).thenReturn(Optional.of(testProfile));
            when(dietaryPreferenceRepository.findByUser(testUser)).thenReturn(Optional.of(testPreference));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any())).thenReturn(testProfile);
            when(nutritionCalculatorService.calculateNutritionTargets(any())).thenReturn(nutritionResult);

            ProfileUpdateRequest request = ProfileUpdateRequest.builder().age(31).build();
            profileService.updateProfile(GUEST_ID, request);

            verify(nutritionTargetRepository).save(any());
        }
    }

    // ==================== getNutritionTargets ====================

    @Nested
    @DisplayName("getNutritionTargets")
    class GetNutritionTargets {

        @Test
        @DisplayName("정상 조회: 목표 영양소 반환")
        void existingTarget_returnsResponse() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(testTarget));

            NutritionTargetResponse response = profileService.getNutritionTargets(GUEST_ID);

            assertThat(response.getTarget().getCalories()).isEqualTo(2200.0);
            assertThat(response.getTarget().getManualOverride()).isFalse();
        }

        @Test
        @DisplayName("목표 없음: RuntimeException 발생")
        void noTarget_throwsRuntimeException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getNutritionTargets(GUEST_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("목표");
        }
    }

    // ==================== updateNutritionTargets ====================

    @Nested
    @DisplayName("updateNutritionTargets")
    class UpdateNutritionTargets {

        @Test
        @DisplayName("수동 업데이트: manualOverride=true로 설정됨")
        void manualUpdate_setsManualOverrideTrue() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(testUser)).thenReturn(Optional.of(testTarget));
            when(nutritionTargetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            NutritionTargetUpdateRequest request = NutritionTargetUpdateRequest.builder()
                    .calories(1800.0).protein(150.0).carbs(180.0).fat(50.0)
                    .build();

            NutritionTargetResponse response = profileService.updateNutritionTargets(GUEST_ID, request);

            assertThat(response.getTarget().getManualOverride()).isTrue();
            assertThat(response.getTarget().getCalories()).isEqualTo(1800.0);
        }

        @Test
        @DisplayName("목표 없음: RuntimeException 발생")
        void noTarget_throwsRuntimeException() {
            when(userRepository.findByGuestId(GUEST_ID)).thenReturn(Optional.of(testUser));
            when(nutritionTargetRepository.findByUser(any())).thenReturn(Optional.empty());

            NutritionTargetUpdateRequest request = NutritionTargetUpdateRequest.builder()
                    .calories(2000.0).protein(100.0).carbs(250.0).fat(65.0)
                    .build();

            assertThatThrownBy(() -> profileService.updateNutritionTargets(GUEST_ID, request))
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
