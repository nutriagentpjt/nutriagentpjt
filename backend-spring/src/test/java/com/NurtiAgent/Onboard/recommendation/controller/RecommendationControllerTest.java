package com.NurtiAgent.Onboard.recommendation.controller;

import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.profile.exception.NutritionTargetNotFoundException;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse;
import com.NurtiAgent.Onboard.recommendation.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * RecommendationController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상:
 *   - GET /recommendations?mealType=LUNCH&date=...&limit=10
 *
 * 의존성: RecommendationService (@MockBean)
 */
@WebMvcTest(RecommendationController.class)
class RecommendationControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean  RecommendationService recommendationService;

    private static final String GUEST_ID = "guest_test-001";
    private static final String TODAY = LocalDate.now().toString();

    private MockHttpSession authSession;

    @BeforeEach
    void setUp() {
        authSession = new MockHttpSession();
        authSession.setAttribute("GUEST_ID", GUEST_ID);
    }

    private RecommendationResponse buildResponse() {
        return RecommendationResponse.builder()
                .setId("set-001")
                .date(TODAY)
                .mealType(MealType.LUNCH)
                .dailyTarget(RecommendationResponse.NutritionDto.builder()
                        .calories(2000.0).protein(150.0).carbs(200.0).fat(60.0).build())
                .mealTarget(RecommendationResponse.NutritionDto.builder()
                        .calories(500.0).protein(37.5).carbs(50.0).fat(15.0).build())
                .consumed(RecommendationResponse.NutritionDto.builder()
                        .calories(0.0).protein(0.0).carbs(0.0).fat(0.0).build())
                .gap(RecommendationResponse.NutritionDto.builder()
                        .calories(500.0).protein(37.5).carbs(50.0).fat(15.0).build())
                .recommendations(List.of())
                .build();
    }

    // ==================== GET /recommendations ====================

    @Nested
    @DisplayName("GET /recommendations")
    class GetRecommendations {

        @Test
        @DisplayName("정상 요청: 200 OK + 추천 응답 반환")
        void normal_returns200() throws Exception {
            when(recommendationService.getRecommendations(
                    eq(GUEST_ID), anyString(), eq(MealType.LUNCH), eq(10)))
                    .thenReturn(buildResponse());

            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "LUNCH")
                            .param("date", TODAY)
                            .param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.setId").value("set-001"))
                    .andExpect(jsonPath("$.mealType").value("LUNCH"));
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/recommendations")
                            .param("mealType", "LUNCH"))
                    .andExpect(status().isUnauthorized());

            verify(recommendationService, never()).getRecommendations(any(), any(), any(), any());
        }

        @Test
        @DisplayName("date 파라미터 없음: 오늘 날짜로 자동 설정")
        void withoutDate_usesToday() throws Exception {
            when(recommendationService.getRecommendations(
                    eq(GUEST_ID), eq(TODAY), eq(MealType.BREAKFAST), eq(10)))
                    .thenReturn(buildResponse());

            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "BREAKFAST"))
                    .andExpect(status().isOk());

            verify(recommendationService).getRecommendations(
                    eq(GUEST_ID), eq(TODAY), eq(MealType.BREAKFAST), eq(10));
        }

        @Test
        @DisplayName("limit=0: 400 BAD_REQUEST (컨트롤러 검증)")
        void limitZero_returns400() throws Exception {
            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "LUNCH")
                            .param("limit", "0"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("limit=21: 400 BAD_REQUEST (컨트롤러 검증)")
        void limitOver20_returns400() throws Exception {
            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "LUNCH")
                            .param("limit", "21"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("limit=1: 경계값 정상 처리")
        void limitOne_isValid() throws Exception {
            when(recommendationService.getRecommendations(any(), any(), any(), eq(1)))
                    .thenReturn(buildResponse());

            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "DINNER")
                            .param("limit", "1"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("limit=20: 경계값 정상 처리")
        void limitTwenty_isValid() throws Exception {
            when(recommendationService.getRecommendations(any(), any(), any(), eq(20)))
                    .thenReturn(buildResponse());

            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "SNACK")
                            .param("limit", "20"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("영양 목표 미설정: 409 CONFLICT (NutritionTargetNotFoundException)")
        void noNutritionTarget_returns409() throws Exception {
            when(recommendationService.getRecommendations(any(), any(), any(), any()))
                    .thenThrow(new NutritionTargetNotFoundException("온보딩을 먼저 완료해주세요"));

            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "LUNCH"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error").exists());
        }

        @Test
        @DisplayName("잘못된 mealType 값: 400 BAD_REQUEST (MethodArgumentTypeMismatch)")
        void invalidMealType_returns400() throws Exception {
            mockMvc.perform(get("/recommendations")
                            .session(authSession)
                            .param("mealType", "INVALID_TYPE"))
                    .andExpect(status().isBadRequest());
        }
    }
}
