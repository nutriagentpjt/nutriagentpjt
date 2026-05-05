package com.NurtiAgent.Onboard.common.config;

import com.NurtiAgent.Onboard.common.exception.DietaryPreferenceNotFoundException;
import com.NurtiAgent.Onboard.common.exception.DuplicateFoodException;
import com.NurtiAgent.Onboard.common.exception.MealNotFoundException;
import com.NurtiAgent.Onboard.common.exception.UnauthorizedException;
import com.NurtiAgent.Onboard.common.exception.UserProfileNotFoundException;
import com.NurtiAgent.Onboard.food.exception.FoodNotFoundException;
import com.NurtiAgent.Onboard.food.exception.InvalidSearchQueryException;
import com.NurtiAgent.Onboard.profile.exception.NutritionTargetNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(UnauthorizedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler({FoodNotFoundException.class, UserProfileNotFoundException.class,
            DietaryPreferenceNotFoundException.class, MealNotFoundException.class})
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler({NutritionTargetNotFoundException.class, DuplicateFoodException.class})
    public ResponseEntity<Map<String, String>> handleConflict(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "잘못된 파라미터 값입니다: " + ex.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler({InvalidSearchQueryException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleInternalError(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "서버 오류가 발생했습니다: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
