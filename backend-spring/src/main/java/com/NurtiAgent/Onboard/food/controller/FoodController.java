package com.NurtiAgent.Onboard.food.controller;

import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import com.NurtiAgent.Onboard.meal.service.FoodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/foods")
@RequiredArgsConstructor
@Tag(name = "Food", description = "음식 검색 및 영양 정보 API")
public class FoodController {

    private final FoodService foodService;

    /**
     * 음식 검색 (그룹화 + 평균)
     * FastAPI /foods/search와 동일
     */
    @GetMapping("/search")
    @Operation(summary = "음식 검색", description = "키워드로 음식을 검색하고 평균 영양 정보를 반환합니다")
    public ResponseEntity<List<FoodResponse>> searchFoods(
            @Parameter(description = "검색 키워드", required = true)
            @RequestParam String query,

            @Parameter(description = "결과 개수 제한 (기본: 20, 최대: 100)")
            @RequestParam(defaultValue = "20") int limit,

            @Parameter(description = "시작 위치 (페이지네이션)")
            @RequestParam(defaultValue = "0") int offset
    ) {
        // Validation
        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }
        if (offset < 0) {
            throw new IllegalArgumentException("offset must be non-negative");
        }

        FoodSearchResponse response = foodService.searchFoods(query.trim(), limit, offset);
        return ResponseEntity.ok(response.getFoods());
    }

    /**
     * 음식 상세 조회 (정확한 이름 매칭 + 평균)
     * FastAPI /foods/detail과 동일
     */
    @GetMapping("/detail")
    @Operation(summary = "음식 상세 조회", description = "정확한 음식 이름으로 평균 영양 정보를 조회합니다")
    public ResponseEntity<FoodResponse> getFoodDetail(
            @Parameter(description = "음식 이름 (정확히 일치해야 함)", required = true)
            @RequestParam String name
    ) {
        // trim() 추가 및 GlobalExceptionHandler가 처리하도록 변경
        FoodResponse response = foodService.getFoodByName(name.trim());
        return ResponseEntity.ok(response);
    }

    /**
     * 자동완성용 음식 이름 검색
     * FastAPI /foods/autocomplete과 동일
     */
    @GetMapping("/autocomplete")
    @Operation(summary = "음식 자동완성", description = "검색어를 포함하는 음식 이름 목록을 반환합니다")
    public ResponseEntity<List<Map<String, Object>>> autocomplete(
            @Parameter(description = "검색 키워드", required = true)
            @RequestParam String query,

            @Parameter(description = "결과 개수 제한 (기본: 10, 최대: 50)")
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<String> names = foodService.autocomplete(query, limit);

        // FastAPI와 동일한 응답 형식: [{"id": 1, "name": "..."}, ...]
        // Sequential ID 사용 (hash 충돌 방지)
        List<Map<String, Object>> response = IntStream.range(0, names.size())
                .mapToObj(i -> {
                    Map<String, Object> item = Map.of(
                            "id", i + 1,
                            "name", names.get(i)
                    );
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
