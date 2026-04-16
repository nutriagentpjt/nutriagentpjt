package com.NurtiAgent.Onboard.meal.controller;

import com.NurtiAgent.Onboard.common.enums.MealSource;
import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.meal.dto.*;
import com.NurtiAgent.Onboard.meal.service.MealService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MealController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상: HTTP 요청/응답 + 세션 인증 처리
 *   - POST   /meals           → 201 / 401
 *   - GET    /meals?date      → 200 / 401
 *   - PUT    /meals/{id}      → 200 / 401
 *   - DELETE /meals/{id}      → 200 / 401
 *   - GET    /meals/summary   → 200 / 401
 *
 * 의존성: MealService (@MockBean)
 */
@WebMvcTest(MealController.class)
class MealControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean  MealService mealService;

    private ObjectMapper objectMapper;
    private MockHttpSession authSession;

    private static final String GUEST_ID = "guest_test-001";

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        authSession = new MockHttpSession();
        authSession.setAttribute("GUEST_ID", GUEST_ID);
    }

    // -------------------- 픽스처 --------------------

    private MealResponse buildMealResponse() {
        return MealResponse.builder()
                .id(1L).userId(GUEST_ID)
                .foodName("닭가슴살").amount(200.0)
                .calories(330.0).protein(62.0).carbs(0.0).fat(7.2)
                .mealType(MealType.LUNCH)
                .date(LocalDate.now().toString())
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    private MealListResponse buildMealListResponse() {
        return MealListResponse.builder()
                .date(LocalDate.now().toString())
                .summary(MealListResponse.NutritionSummary.builder()
                        .totalCalories(330.0).totalProtein(62.0)
                        .totalCarbs(0.0).totalFat(7.2)
                        .build())
                .meals(List.of())
                .build();
    }

    // ==================== POST /meals ====================

    @Nested
    @DisplayName("POST /meals - createMeal")
    class CreateMeal {

        @Test
        @DisplayName("세션 있음: 201 CREATED 반환")
        void withSession_returns201() throws Exception {
            when(mealService.createMeal(eq(GUEST_ID), any())).thenReturn(buildMealResponse());

            String body = objectMapper.writeValueAsString(
                    MealRequest.builder()
                            .foodName("닭가슴살").amount(200.0)
                            .mealType(MealType.LUNCH).date(LocalDate.now())
                            .source(MealSource.MANUAL)
                            .build());

            mockMvc.perform(post("/meals")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.foodName").value("닭가슴살"))
                    .andExpect(jsonPath("$.calories").value(330.0));
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED 반환")
        void withoutSession_returns401() throws Exception {
            String body = objectMapper.writeValueAsString(
                    MealRequest.builder()
                            .foodName("닭가슴살").amount(200.0)
                            .mealType(MealType.LUNCH).date(LocalDate.now())
                            .build());

            mockMvc.perform(post("/meals")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isUnauthorized());

            verify(mealService, never()).createMeal(any(), any());
        }

        @Test
        @DisplayName("필수 필드 누락 (@Valid): 400 BAD_REQUEST")
        void missingRequiredField_returns400() throws Exception {
            // foodName 누락
            String body = "{\"amount\": 100, \"mealType\": \"LUNCH\", \"date\": \"" + LocalDate.now() + "\"}";

            mockMvc.perform(post("/meals")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==================== GET /meals ====================

    @Nested
    @DisplayName("GET /meals - getMealsByDate")
    class GetMealsByDate {

        @Test
        @DisplayName("세션 있음: 200 OK + 응답 반환")
        void withSession_returns200() throws Exception {
            when(mealService.getMealsByDate(GUEST_ID, LocalDate.now().toString()))
                    .thenReturn(buildMealListResponse());

            mockMvc.perform(get("/meals")
                            .session(authSession)
                            .param("date", LocalDate.now().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.date").exists())
                    .andExpect(jsonPath("$.summary").exists());
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/meals").param("date", LocalDate.now().toString()))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== PUT /meals/{id} ====================

    @Nested
    @DisplayName("PUT /meals/{mealId} - updateMeal")
    class UpdateMeal {

        @Test
        @DisplayName("세션 있음: 200 OK + 수정된 응답 반환")
        void withSession_returns200() throws Exception {
            MealResponse updated = buildMealResponse();
            when(mealService.updateMeal(eq(GUEST_ID), eq(1L), any())).thenReturn(updated);

            String body = objectMapper.writeValueAsString(
                    MealUpdateRequest.builder().amount(300.0).build());

            mockMvc.perform(put("/meals/1")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(put("/meals/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== DELETE /meals/{id} ====================

    @Nested
    @DisplayName("DELETE /meals/{mealId} - deleteMeal")
    class DeleteMeal {

        @Test
        @DisplayName("세션 있음: 200 OK + success=true")
        void withSession_returns200() throws Exception {
            when(mealService.deleteMeal(GUEST_ID, 1L))
                    .thenReturn(MealDeleteResponse.builder()
                            .success(true).message("삭제됨").build());

            mockMvc.perform(delete("/meals/1").session(authSession))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(delete("/meals/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== GET /meals/summary ====================

    @Nested
    @DisplayName("GET /meals/summary - getMealSummary")
    class GetMealSummary {

        @Test
        @DisplayName("세션 있음: 200 OK + consumed 포함")
        void withSession_returns200() throws Exception {
            when(mealService.getMealSummary(GUEST_ID, LocalDate.now().toString()))
                    .thenReturn(MealSummaryResponse.builder()
                            .consumed(MealSummaryResponse.ConsumedNutrition.builder()
                                    .calories(500.0).protein(40.0).carbs(60.0).fat(15.0)
                                    .build())
                            .build());

            mockMvc.perform(get("/meals/summary")
                            .session(authSession)
                            .param("date", LocalDate.now().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.consumed.calories").value(500.0));
        }

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/meals/summary").param("date", LocalDate.now().toString()))
                    .andExpect(status().isUnauthorized());
        }
    }
}
