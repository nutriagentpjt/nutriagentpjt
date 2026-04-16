package com.NurtiAgent.Onboard.food.controller;

import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.food.exception.InvalidSearchQueryException;
import com.NurtiAgent.Onboard.meal.dto.FoodResponse;
import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import com.NurtiAgent.Onboard.meal.service.FoodService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FoodController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상:
 *   - GET /foods/search
 *   - GET /foods/detail
 *   - GET /foods/autocomplete
 *
 * 의존성: FoodService (@MockBean)
 */
@WebMvcTest(FoodController.class)
class FoodControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean  FoodService foodService;

    // ==================== GET /foods/search ====================

    @Nested
    @DisplayName("GET /foods/search")
    class SearchFoods {

        @Test
        @DisplayName("정상 검색: 200 OK + 음식 목록 반환")
        void normalSearch_returns200() throws Exception {
            FoodResponse food = FoodResponse.builder()
                    .name("닭가슴살").calories(165.0).protein(31.0).carbs(0.0).fat(3.6)
                    .variants(2).build();
            when(foodService.searchFoods(eq("닭"), anyInt(), anyInt()))
                    .thenReturn(FoodSearchResponse.builder().foods(List.of(food)).total(1).build());

            mockMvc.perform(get("/foods/search").param("query", "닭"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].name").value("닭가슴살"))
                    .andExpect(jsonPath("$[0].calories").value(165.0));
        }

        @Test
        @DisplayName("결과 없음: 200 OK + 빈 배열")
        void noResult_returnsEmptyList() throws Exception {
            when(foodService.searchFoods(any(), anyInt(), anyInt()))
                    .thenReturn(FoodSearchResponse.builder().foods(List.of()).total(0).build());

            mockMvc.perform(get("/foods/search").param("query", "xyz없는음식"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("limit=0: 400 BAD_REQUEST (컨트롤러 검증)")
        void invalidLimit_returns400() throws Exception {
            mockMvc.perform(get("/foods/search")
                            .param("query", "닭")
                            .param("limit", "0"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("limit=101: 400 BAD_REQUEST (컨트롤러 검증)")
        void limitOver100_returns400() throws Exception {
            mockMvc.perform(get("/foods/search")
                            .param("query", "닭")
                            .param("limit", "101"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("offset=-1: 400 BAD_REQUEST (컨트롤러 검증)")
        void negativeOffset_returns400() throws Exception {
            mockMvc.perform(get("/foods/search")
                            .param("query", "닭")
                            .param("offset", "-1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("InvalidSearchQueryException → 400 BAD_REQUEST (GlobalExceptionHandler)")
        void invalidQuery_returns400() throws Exception {
            when(foodService.searchFoods(any(), anyInt(), anyInt()))
                    .thenThrow(new InvalidSearchQueryException("검색어를 입력해주세요"));

            mockMvc.perform(get("/foods/search").param("query", " "))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("검색어를 입력해주세요"));
        }
    }

    // ==================== GET /foods/detail ====================

    @Nested
    @DisplayName("GET /foods/detail")
    class GetFoodDetail {

        @Test
        @DisplayName("정상 조회: 200 OK + 음식 정보 반환")
        void existing_returns200() throws Exception {
            FoodResponse food = FoodResponse.builder()
                    .name("닭가슴살").calories(165.0).protein(31.0).carbs(0.0).fat(3.6)
                    .variants(2).build();
            when(foodService.getFoodByName("닭가슴살")).thenReturn(food);

            mockMvc.perform(get("/foods/detail").param("name", "닭가슴살"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("닭가슴살"))
                    .andExpect(jsonPath("$.protein").value(31.0));
        }

        @Test
        @DisplayName("존재하지 않는 음식: 404 NOT_FOUND (GlobalExceptionHandler)")
        void notFound_returns404() throws Exception {
            when(foodService.getFoodByName("없는음식"))
                    .thenThrow(new FoodNotFoundException("해당 자료를 찾을 수 없습니다"));

            mockMvc.perform(get("/foods/detail").param("name", "없는음식"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("해당 자료를 찾을 수 없습니다"));
        }
    }

    // ==================== GET /foods/autocomplete ====================

    @Nested
    @DisplayName("GET /foods/autocomplete")
    class Autocomplete {

        @Test
        @DisplayName("정상 자동완성: 200 OK + {id, name} 형식 반환")
        void normal_returnsIdNameFormat() throws Exception {
            when(foodService.autocomplete(eq("닭"), anyInt()))
                    .thenReturn(List.of("닭가슴살", "닭갈비"));

            mockMvc.perform(get("/foods/autocomplete").param("query", "닭"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].name").value("닭가슴살"))
                    .andExpect(jsonPath("$[1].id").value(2))
                    .andExpect(jsonPath("$[1].name").value("닭갈비"));
        }

        @Test
        @DisplayName("결과 없음: 200 OK + 빈 배열")
        void noResult_returnsEmpty() throws Exception {
            when(foodService.autocomplete(any(), anyInt())).thenReturn(List.of());

            mockMvc.perform(get("/foods/autocomplete").param("query", "xyz"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("InvalidSearchQueryException → 400 BAD_REQUEST")
        void invalidQuery_returns400() throws Exception {
            when(foodService.autocomplete(any(), anyInt()))
                    .thenThrow(new InvalidSearchQueryException("검색어를 입력해주세요"));

            mockMvc.perform(get("/foods/autocomplete").param("query", ""))
                    .andExpect(status().isBadRequest());
        }
    }
}
