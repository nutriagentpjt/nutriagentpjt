package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import com.NurtiAgent.Onboard.meal.entity.Food;
import com.NurtiAgent.Onboard.meal.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;

    @Transactional(readOnly = true)
    public FoodSearchResponse searchFoods(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어를 입력해주세요");
        }

        // 음식 검색 (최대 20개)
        List<Food> foods = foodRepository.searchByKeyword(keyword.trim());

        // 최대 20개로 제한
        List<Food> limitedFoods = foods.stream()
                .limit(20)
                .collect(Collectors.toList());

        // FoodResponse로 변환
        List<FoodResponse> foodResponses = limitedFoods.stream()
                .map(food -> FoodResponse.builder()
                        .id(food.getId())
                        .name(food.getName())
                        .weight(food.getWeight())
                        .calories(food.getCalories())
                        .carbs(food.getCarbs())
                        .protein(food.getProtein())
                        .fat(food.getFat())
                        .sodium(food.getSodium())
                        .build())
                .collect(Collectors.toList());

        return FoodSearchResponse.builder()
                .foods(foodResponses)
                .total(foods.size())
                .build();
    }
}
