package com.NurtiAgent.Onboard.meal.service;

import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final RestTemplate restTemplate;

    @Value("${food.service.url}")
    private String foodServiceUrl;

    public FoodSearchResponse searchFoods(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어를 입력해주세요");
        }

        String url = foodServiceUrl + "/search?query=" + keyword.trim();

        try {
            // FastAPI 호출 - List<FoodResponse> 반환
            ResponseEntity<List<FoodResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<FoodResponse>>() {}
            );

            List<FoodResponse> foods = response.getBody();

            return FoodSearchResponse.builder()
                    .foods(foods != null ? foods : List.of())
                    .total(foods != null ? foods.size() : 0)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("음식 검색 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    public FoodResponse getFoodByName(String foodName) {
        String url = foodServiceUrl + "/detail?name=" + foodName;

        try {
            FoodResponse response = restTemplate.getForObject(url, FoodResponse.class);

            if (response == null) {
                throw new RuntimeException("음식 정보를 찾을 수 없습니다");
            }

            return response;

        } catch (Exception e) {
            throw new RuntimeException("음식 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
