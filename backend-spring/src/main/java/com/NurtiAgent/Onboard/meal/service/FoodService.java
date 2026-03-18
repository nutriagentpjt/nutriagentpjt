package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.food.exception.InvalidSearchQueryException;
import com.NurtiAgent.Onboard.food.repository.FoodRepository;
import com.NurtiAgent.Onboard.food.repository.FoodRepository.FoodSearchProjection;
import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoodService {

    private final FoodRepository foodRepository;

    /**
     * 음식 검색 (그룹화 + 평균)
     * 기존 FastAPI /search 엔드포인트와 동일한 동작
     */
    public FoodSearchResponse searchFoods(String keyword) {
        return searchFoods(keyword, 20, 0);
    }

    /**
     * 음식 검색 with pagination
     */
    public FoodSearchResponse searchFoods(String keyword, int limit, int offset) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new InvalidSearchQueryException("검색어를 입력해주세요");
        }

        try {
            Pageable pageable = PageRequest.of(offset / limit, limit);
            List<FoodSearchProjection> projections = foodRepository.searchFoods(keyword.trim(), pageable);

            List<FoodResponse> foods = projections.stream()
                    .map(this::projectionToResponse)
                    .collect(Collectors.toList());

            return FoodSearchResponse.builder()
                    .foods(foods)
                    .total(foods.size())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("음식 검색 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 음식 상세 조회 (정확한 이름 매칭 + 평균)
     * 기존 FastAPI /detail 엔드포인트와 동일한 동작
     */
    public FoodResponse getFoodByName(String foodName) {
        if (foodName == null || foodName.trim().isEmpty()) {
            throw new InvalidSearchQueryException("음식 이름을 입력해주세요");
        }

        try {
            FoodSearchProjection projection = foodRepository.findByNameExact(foodName.trim())
                    .orElseThrow(() -> new FoodNotFoundException("해당 자료를 찾을 수 없습니다"));

            return projectionToResponse(projection);

        } catch (FoodNotFoundException e) {
            throw e;  // Re-throw as-is
        } catch (Exception e) {
            throw new RuntimeException("음식 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Projection을 FoodResponse로 변환
     */
    private FoodResponse projectionToResponse(FoodSearchProjection projection) {
        return FoodResponse.builder()
                .name(projection.getName())
                .calories(roundOrNull(projection.getCalories(), 2))
                .protein(roundOrNull(projection.getProtein(), 2))
                .carbs(roundOrNull(projection.getCarbs(), 2))
                .fat(roundOrNull(projection.getFat(), 2))
                .sodium(roundOrNull(projection.getSodium(), 2))
                .sugars(roundOrNull(projection.getSugars(), 2))
                .fiber(roundOrNull(projection.getFiber(), 2))
                .cholesterol(roundOrNull(projection.getCholesterol(), 2))
                .saturatedFat(roundOrNull(projection.getSaturatedFat(), 2))
                .transFat(roundOrNull(projection.getTransFat(), 2))
                .variants(projection.getVariants())
                .build();
    }

    /**
     * 자동완성용 음식 이름 검색
     * 검증 포함, Controller에서 직접 Repository 호출 제거를 위함
     */
    public List<String> autocomplete(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            throw new InvalidSearchQueryException("검색어를 입력해주세요");
        }
        if (limit < 1 || limit > 50) {
            throw new IllegalArgumentException("limit must be between 1 and 50");
        }

        return foodRepository.findNamesForAutocomplete(query.trim(), limit);
    }

    /**
     * 반올림 헬퍼 (null-safe)
     */
    private Double roundOrNull(Double value, int places) {
        if (value == null) {
            return null;
        }
        double scale = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }
}
