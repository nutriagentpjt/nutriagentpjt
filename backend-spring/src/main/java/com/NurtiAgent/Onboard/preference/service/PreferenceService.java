package com.NurtiAgent.Onboard.preference.service;

import com.NurtiAgent.Onboard.common.enums.FoodType;
import com.NurtiAgent.Onboard.preference.dto.AddFoodRequest;
import com.NurtiAgent.Onboard.preference.dto.PreferenceResponse;
import com.NurtiAgent.Onboard.preference.dto.RemoveFoodRequest;
import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import com.NurtiAgent.Onboard.profile.repository.DietaryPreferenceRepository;
import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final UserRepository userRepository;
    private final DietaryPreferenceRepository dietaryPreferenceRepository;

    @Transactional
    public PreferenceResponse addFood(String guestId, AddFoodRequest request) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        DietaryPreference preference = dietaryPreferenceRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("식단 설정을 찾을 수 없습니다"));

        if (request.getType() == FoodType.PREFERRED) {
            // 선호 음식 추가
            if (preference.getPreferredFoods() == null) {
                preference.setPreferredFoods(new ArrayList<>());
            }

            // 중복 체크
            if (preference.getPreferredFoods().contains(request.getFoodName())) {
                throw new IllegalArgumentException("이미 선호 음식에 추가되어 있습니다: " + request.getFoodName());
            }

            // 비선호 음식에 있는지 체크
            if (preference.getDislikedFoods() != null &&
                    preference.getDislikedFoods().stream()
                            .anyMatch(item -> item.getFoodName().equals(request.getFoodName()))) {
                throw new IllegalArgumentException("비선호 음식에 이미 등록된 음식입니다: " + request.getFoodName());
            }

            preference.getPreferredFoods().add(request.getFoodName());

        } else if (request.getType() == FoodType.DISLIKED) {
            // 비선호 음식 추가
            if (preference.getDislikedFoods() == null) {
                preference.setDislikedFoods(new ArrayList<>());
            }

            // 중복 체크
            if (preference.getDislikedFoods().stream()
                    .anyMatch(item -> item.getFoodName().equals(request.getFoodName()))) {
                throw new IllegalArgumentException("이미 비선호 음식에 추가되어 있습니다: " + request.getFoodName());
            }

            // 선호 음식에 있는지 체크
            if (preference.getPreferredFoods() != null &&
                    preference.getPreferredFoods().contains(request.getFoodName())) {
                throw new IllegalArgumentException("선호 음식에 이미 등록된 음식입니다: " + request.getFoodName());
            }

            preference.getDislikedFoods().add(
                    new DietaryPreference.DislikedFoodItem(request.getFoodName(), request.getReason())
            );
        }

        dietaryPreferenceRepository.save(preference);
        return buildPreferenceResponse(preference);
    }

    @Transactional
    public PreferenceResponse removeFood(String guestId, RemoveFoodRequest request) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        DietaryPreference preference = dietaryPreferenceRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("식단 설정을 찾을 수 없습니다"));

        if (request.getType() == FoodType.PREFERRED) {
            // 선호 음식 제거
            if (preference.getPreferredFoods() == null ||
                    !preference.getPreferredFoods().contains(request.getFoodName())) {
                throw new IllegalArgumentException("선호 음식 목록에 없는 음식입니다: " + request.getFoodName());
            }
            preference.getPreferredFoods().remove(request.getFoodName());

        } else if (request.getType() == FoodType.DISLIKED) {
            // 비선호 음식 제거
            if (preference.getDislikedFoods() == null) {
                throw new IllegalArgumentException("비선호 음식 목록에 없는 음식입니다: " + request.getFoodName());
            }

            boolean removed = preference.getDislikedFoods().removeIf(
                    item -> item.getFoodName().equals(request.getFoodName())
            );

            if (!removed) {
                throw new IllegalArgumentException("비선호 음식 목록에 없는 음식입니다: " + request.getFoodName());
            }
        }

        dietaryPreferenceRepository.save(preference);
        return buildPreferenceResponse(preference);
    }

    @Transactional(readOnly = true)
    public PreferenceResponse getPreferences(String guestId) {
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new RuntimeException("인증 실패 (세션 없음)"));

        DietaryPreference preference = dietaryPreferenceRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("식단 설정을 찾을 수 없습니다"));

        return buildPreferenceResponse(preference);
    }

    private PreferenceResponse buildPreferenceResponse(DietaryPreference preference) {
        PreferenceResponse.DietaryConstraintsDto constraintsDto = null;
        if (preference.getConstraints() != null) {
            constraintsDto = PreferenceResponse.DietaryConstraintsDto.builder()
                    .lowSodium(preference.getConstraints().getLowSodium())
                    .lowSugar(preference.getConstraints().getLowSugar())
                    .maxCaloriesPerMeal(preference.getConstraints().getMaxCaloriesPerMeal())
                    .build();
        }

        return PreferenceResponse.builder()
                .mealPattern(preference.getMealPattern())
                .preferredFoods(preference.getPreferredFoods())
                .dislikedFoods(preference.getDislikedFoods() != null ?
                        preference.getDislikedFoods().stream()
                                .map(item -> new PreferenceResponse.DislikedFoodDto(
                                        item.getFoodName(), item.getReason()))
                                .collect(Collectors.toList()) : new ArrayList<>())
                .allergies(preference.getAllergies())
                .dietStyles(preference.getDietStyles())
                .waterIntakeGoal(preference.getWaterIntakeGoal())
                .constraints(constraintsDto)
                .updatedAt(preference.getUpdatedAt())
                .build();
    }
}
