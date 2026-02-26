package com.NurtiAgent.Onboard.profile.service;

import com.NurtiAgent.Onboard.profile.dto.*;
import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import com.NurtiAgent.Onboard.profile.repository.DietaryPreferenceRepository;
import com.NurtiAgent.Onboard.profile.repository.NutritionTargetRepository;
import com.NurtiAgent.Onboard.profile.repository.UserProfileRepository;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final DietaryPreferenceRepository dietaryPreferenceRepository;
    private final NutritionTargetRepository nutritionTargetRepository;
    private final NutritionCalculatorService nutritionCalculatorService;

    @Transactional
    public OnboardingResponse saveOnboarding(String guestId, OnboardingRequest request) {
        // 1. User 조회 또는 생성
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        // 2. 선호/비선호 음식 중복 검증
        if (request.getPreferredFoods() != null && request.getDislikedFoods() != null) {
            for (String preferred : request.getPreferredFoods()) {
                boolean isDuplicate = request.getDislikedFoods().stream()
                        .anyMatch(disliked -> disliked.getFoodName().equals(preferred));
                if (isDuplicate) {
                    throw new IllegalArgumentException("선호 음식과 비선호 음식에 동일한 음식이 있습니다: " + preferred);
                }
            }
        }

        // 3. UserProfile 생성 및 저장
        UserProfile userProfile = UserProfile.builder()
                .user(user)
                .age(request.getAge())
                .gender(request.getGender())
                .height(request.getHeight())
                .weight(request.getWeight())
                .healthGoal(request.getHealthGoal())
                .activityLevel(request.getActivityLevel())
                .exerciseFrequency(request.getExerciseFrequency())
                .exerciseTime(request.getExerciseTime())
                .diseases(request.getDiseases() != null ? request.getDiseases() : new ArrayList<>())
                .onboardingCompleted(true)
                .build();
        userProfileRepository.save(userProfile);

        // 4. DietaryPreference 생성 및 저장
        DietaryPreference.DietaryConstraints constraints = null;
        if (request.getConstraints() != null) {
            constraints = DietaryPreference.DietaryConstraints.builder()
                    .lowSodium(request.getConstraints().getLowSodium())
                    .lowSugar(request.getConstraints().getLowSugar())
                    .maxCaloriesPerMeal(request.getConstraints().getMaxCaloriesPerMeal())
                    .build();
        }

        DietaryPreference dietaryPreference = DietaryPreference.builder()
                .user(user)
                .mealPattern(request.getMealPattern())
                .preferredFoods(request.getPreferredFoods() != null ? request.getPreferredFoods() : new ArrayList<>())
                .dislikedFoods(request.getDislikedFoods() != null ?
                        request.getDislikedFoods().stream()
                                .map(dto -> new DietaryPreference.DislikedFoodItem(dto.getFoodName(), dto.getReason()))
                                .collect(Collectors.toList()) : new ArrayList<>())
                .allergies(request.getAllergies() != null ? request.getAllergies() : new ArrayList<>())
                .dietStyles(request.getDietStyles() != null ? request.getDietStyles() : new ArrayList<>())
                .waterIntakeGoal(request.getWaterIntakeGoal())
                .constraints(constraints)
                .build();
        dietaryPreferenceRepository.save(dietaryPreference);

        // 5. BMR/TDEE 계산 및 NutritionTarget 생성
        NutritionCalculatorService.NutritionResult nutritionResult =
                nutritionCalculatorService.calculateNutritionTargets(userProfile);

        NutritionTarget nutritionTarget = NutritionTarget.builder()
                .user(user)
                .calories(nutritionResult.getTargetCalories())
                .protein(nutritionResult.getProtein())
                .carbs(nutritionResult.getCarbs())
                .fat(nutritionResult.getFat())
                .bmr(nutritionResult.getBmr())
                .tdee(nutritionResult.getTdee())
                .build();
        nutritionTargetRepository.save(nutritionTarget);

        // 6. Response 생성
        return buildOnboardingResponse(user, userProfile, dietaryPreference);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String guestId) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("프로필을 찾을 수 없습니다"));

        DietaryPreference dietaryPreference = dietaryPreferenceRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("식단 설정을 찾을 수 없습니다"));

        return buildProfileResponse(user, userProfile, dietaryPreference);
    }

    @Transactional
    public ProfileResponse updateProfile(String guestId, ProfileUpdateRequest request) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        UserProfile userProfile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("프로필을 찾을 수 없습니다"));

        DietaryPreference dietaryPreference = dietaryPreferenceRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("식단 설정을 찾을 수 없습니다"));

        // 부분 수정 지원
        boolean needsRecalculation = false;
        if (request.getAge() != null) {
            userProfile.setAge(request.getAge());
            needsRecalculation = true;
        }
        if (request.getGender() != null) {
            userProfile.setGender(request.getGender());
            needsRecalculation = true;
        }
        if (request.getHeight() != null) {
            userProfile.setHeight(request.getHeight());
            needsRecalculation = true;
        }
        if (request.getWeight() != null) {
            userProfile.setWeight(request.getWeight());
            needsRecalculation = true;
        }
        if (request.getHealthGoal() != null) {
            userProfile.setHealthGoal(request.getHealthGoal());
            needsRecalculation = true;
        }
        if (request.getActivityLevel() != null) {
            userProfile.setActivityLevel(request.getActivityLevel());
            needsRecalculation = true;
        }
        if (request.getExerciseFrequency() != null) {
            userProfile.setExerciseFrequency(request.getExerciseFrequency());
        }
        if (request.getExerciseTime() != null) {
            userProfile.setExerciseTime(request.getExerciseTime());
        }
        if (request.getDiseases() != null) {
            userProfile.setDiseases(request.getDiseases());
        }

        userProfileRepository.save(userProfile);

        // BMR/TDEE 재계산이 필요한 경우
        if (needsRecalculation) {
            NutritionCalculatorService.NutritionResult nutritionResult =
                    nutritionCalculatorService.calculateNutritionTargets(userProfile);

            NutritionTarget nutritionTarget = nutritionTargetRepository.findByUser(user)
                    .orElse(NutritionTarget.builder().user(user).build());

            nutritionTarget.setCalories(nutritionResult.getTargetCalories());
            nutritionTarget.setProtein(nutritionResult.getProtein());
            nutritionTarget.setCarbs(nutritionResult.getCarbs());
            nutritionTarget.setFat(nutritionResult.getFat());
            nutritionTarget.setBmr(nutritionResult.getBmr());
            nutritionTarget.setTdee(nutritionResult.getTdee());

            nutritionTargetRepository.save(nutritionTarget);
        }

        return buildProfileResponse(user, userProfile, dietaryPreference);
    }

    @Transactional(readOnly = true)
    public NutritionTargetResponse getNutritionTargets(String guestId) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        NutritionTarget nutritionTarget = nutritionTargetRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("목표 정보 없음 (온보딩 미완료)"));

        return NutritionTargetResponse.builder()
                .target(NutritionTargetResponse.TargetDto.builder()
                        .calories(nutritionTarget.getCalories())
                        .protein(nutritionTarget.getProtein())
                        .carbs(nutritionTarget.getCarbs())
                        .fat(nutritionTarget.getFat())
                        .build())
                .build();
    }

    private OnboardingResponse buildOnboardingResponse(User user, UserProfile profile, DietaryPreference preference) {
        OnboardingResponse.DietaryConstraintsDto constraintsDto = null;
        if (preference.getConstraints() != null) {
            constraintsDto = OnboardingResponse.DietaryConstraintsDto.builder()
                    .lowSodium(preference.getConstraints().getLowSodium())
                    .lowSugar(preference.getConstraints().getLowSugar())
                    .maxCaloriesPerMeal(preference.getConstraints().getMaxCaloriesPerMeal())
                    .build();
        }

        return OnboardingResponse.builder()
                .userId(user.getGuestId())
                .age(profile.getAge())
                .gender(profile.getGender())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .healthGoal(profile.getHealthGoal())
                .activityLevel(profile.getActivityLevel())
                .exerciseFrequency(profile.getExerciseFrequency())
                .exerciseTime(profile.getExerciseTime())
                .mealPattern(preference.getMealPattern())
                .preferredFoods(preference.getPreferredFoods())
                .dislikedFoods(preference.getDislikedFoods() != null ?
                        preference.getDislikedFoods().stream()
                                .map(item -> new OnboardingResponse.DislikedFoodDto(item.getFoodName(), item.getReason()))
                                .collect(Collectors.toList()) : new ArrayList<>())
                .allergies(preference.getAllergies())
                .diseases(profile.getDiseases())
                .dietStyles(preference.getDietStyles())
                .waterIntakeGoal(preference.getWaterIntakeGoal())
                .constraints(constraintsDto)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private ProfileResponse buildProfileResponse(User user, UserProfile profile, DietaryPreference preference) {
        ProfileResponse.DietaryConstraintsDto constraintsDto = null;
        if (preference.getConstraints() != null) {
            constraintsDto = ProfileResponse.DietaryConstraintsDto.builder()
                    .lowSodium(preference.getConstraints().getLowSodium())
                    .lowSugar(preference.getConstraints().getLowSugar())
                    .maxCaloriesPerMeal(preference.getConstraints().getMaxCaloriesPerMeal())
                    .build();
        }

        return ProfileResponse.builder()
                .userId(user.getGuestId())
                .age(profile.getAge())
                .gender(profile.getGender())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .healthGoal(profile.getHealthGoal())
                .activityLevel(profile.getActivityLevel())
                .exerciseFrequency(profile.getExerciseFrequency())
                .exerciseTime(profile.getExerciseTime())
                .mealPattern(preference.getMealPattern())
                .preferredFoods(preference.getPreferredFoods())
                .dislikedFoods(preference.getDislikedFoods() != null ?
                        preference.getDislikedFoods().stream()
                                .map(DietaryPreference.DislikedFoodItem::getFoodName)
                                .collect(Collectors.toList()) : new ArrayList<>())
                .allergies(preference.getAllergies())
                .diseases(profile.getDiseases())
                .dietStyles(preference.getDietStyles())
                .waterIntakeGoal(preference.getWaterIntakeGoal())
                .constraints(constraintsDto)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
