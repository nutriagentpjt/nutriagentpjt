package com.NurtiAgent.Onboard.meal.controller;

import com.NurtiAgent.Onboard.meal.dto.*;
import com.NurtiAgent.Onboard.meal.service.MealService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealService mealService;

    @PostMapping
    public ResponseEntity<MealResponse> createMeal(
            HttpSession session,
            @Valid @RequestBody MealRequest request) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MealResponse response = mealService.createMeal(guestId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<MealListResponse> getMealsByDate(
            HttpSession session,
            @RequestParam String date) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MealListResponse response = mealService.getMealsByDate(guestId, date);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{mealId}")
    public ResponseEntity<MealResponse> updateMeal(
            HttpSession session,
            @PathVariable Long mealId,
            @Valid @RequestBody MealUpdateRequest request) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MealResponse response = mealService.updateMeal(guestId, mealId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{mealId}")
    public ResponseEntity<MealDeleteResponse> deleteMeal(
            HttpSession session,
            @PathVariable Long mealId) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MealDeleteResponse response = mealService.deleteMeal(guestId, mealId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<MealSummaryResponse> getMealSummary(
            HttpSession session,
            @RequestParam String date) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MealSummaryResponse response = mealService.getMealSummary(guestId, date);
        return ResponseEntity.ok(response);
    }
}
