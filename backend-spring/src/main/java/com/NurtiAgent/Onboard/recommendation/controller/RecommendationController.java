package com.NurtiAgent.Onboard.recommendation.controller;

import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.recommendation.dto.RecommendationResponse;
import com.NurtiAgent.Onboard.recommendation.service.RecommendationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<RecommendationResponse> getRecommendations(
            HttpSession session,
            @RequestParam(required = false) String date,
            @RequestParam MealType mealType,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {

        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // date가 없으면 오늘 날짜 사용
        String targetDate = (date != null && !date.isEmpty()) ? date : LocalDate.now().toString();

        // limit 범위 검증 (1 ~ 20)
        if (limit < 1 || limit > 20) {
            return ResponseEntity.badRequest().build();
        }

        try {
            RecommendationResponse response = recommendationService.getRecommendations(
                    guestId, targetDate, mealType, limit);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("목표 설정이 필요합니다")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
            }
            throw e;
        }
    }
}
