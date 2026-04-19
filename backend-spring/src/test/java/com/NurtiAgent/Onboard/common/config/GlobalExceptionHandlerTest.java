package com.NurtiAgent.Onboard.common.config;

import com.NurtiAgent.Onboard.common.exception.DietaryPreferenceNotFoundException;
import com.NurtiAgent.Onboard.common.exception.DuplicateFoodException;
import com.NurtiAgent.Onboard.common.exception.MealNotFoundException;
import com.NurtiAgent.Onboard.common.exception.UnauthorizedException;
import com.NurtiAgent.Onboard.common.exception.UserProfileNotFoundException;
import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.food.exception.InvalidSearchQueryException;
import com.NurtiAgent.Onboard.profile.exception.NutritionTargetNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * GlobalExceptionHandler 단위 테스트
 *
 * 테스트 대상: 예외 → HTTP 상태 코드 및 에러 바디 매핑
 * 의존성: 없음 (순수 단위 테스트)
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("UnauthorizedException → 401 UNAUTHORIZED")
    void unauthorized_returns401() {
        UnauthorizedException ex = new UnauthorizedException("인증 실패 (세션 없음)");
        ResponseEntity<Map<String, String>> response = handler.handleUnauthorized(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).containsEntry("error", "인증 실패 (세션 없음)");
    }

    @Test
    @DisplayName("FoodNotFoundException → 404 NOT_FOUND")
    void foodNotFound_returns404() {
        FoodNotFoundException ex = new FoodNotFoundException("해당 자료를 찾을 수 없습니다");
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("error", "해당 자료를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("UserProfileNotFoundException → 404 NOT_FOUND")
    void userProfileNotFound_returns404() {
        UserProfileNotFoundException ex = new UserProfileNotFoundException("프로필을 찾을 수 없습니다");
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("error", "프로필을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("DietaryPreferenceNotFoundException → 404 NOT_FOUND")
    void dietaryPreferenceNotFound_returns404() {
        DietaryPreferenceNotFoundException ex = new DietaryPreferenceNotFoundException("식단 설정을 찾을 수 없습니다");
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("error", "식단 설정을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("MealNotFoundException → 404 NOT_FOUND")
    void mealNotFound_returns404() {
        MealNotFoundException ex = new MealNotFoundException("수정할 기록을 찾을 수 없습니다");
        ResponseEntity<Map<String, String>> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("error", "수정할 기록을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("NutritionTargetNotFoundException → 409 CONFLICT")
    void nutritionTargetNotFound_returns409() {
        NutritionTargetNotFoundException ex = new NutritionTargetNotFoundException("목표 없음");
        ResponseEntity<Map<String, String>> response = handler.handleConflict(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsKey("error");
    }

    @Test
    @DisplayName("DuplicateFoodException → 409 CONFLICT")
    void duplicateFood_returns409() {
        DuplicateFoodException ex = new DuplicateFoodException("이미 선호 음식에 추가되어 있습니다");
        ResponseEntity<Map<String, String>> response = handler.handleConflict(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("error", "이미 선호 음식에 추가되어 있습니다");
    }

    @Test
    @DisplayName("InvalidSearchQueryException → 400 BAD_REQUEST")
    void invalidSearchQuery_returns400() {
        InvalidSearchQueryException ex = new InvalidSearchQueryException("검색어를 입력해주세요");
        ResponseEntity<Map<String, String>> response = handler.handleBadRequest(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "검색어를 입력해주세요");
    }

    @Test
    @DisplayName("IllegalArgumentException → 400 BAD_REQUEST")
    void illegalArgument_returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("잘못된 요청입니다");
        ResponseEntity<Map<String, String>> response = handler.handleBadRequest(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "잘못된 요청입니다");
    }

    @Test
    @DisplayName("RuntimeException → 500 INTERNAL_SERVER_ERROR")
    void runtimeException_returns500() {
        RuntimeException ex = new RuntimeException("예기치 못한 오류");
        ResponseEntity<Map<String, String>> response = handler.handleInternalError(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsKey("error");
        assertThat(response.getBody().get("error")).contains("예기치 못한 오류");
    }

    @Test
    @DisplayName("에러 응답 body는 'error' 키를 가짐")
    void allHandlers_haveErrorKey() {
        assertThat(handler.handleUnauthorized(new UnauthorizedException("x")).getBody())
                .containsKey("error");
        assertThat(handler.handleNotFound(new FoodNotFoundException("x")).getBody())
                .containsKey("error");
        assertThat(handler.handleConflict(new NutritionTargetNotFoundException("x")).getBody())
                .containsKey("error");
        assertThat(handler.handleBadRequest(new IllegalArgumentException("x")).getBody())
                .containsKey("error");
        assertThat(handler.handleInternalError(new RuntimeException("x")).getBody())
                .containsKey("error");
    }
}
