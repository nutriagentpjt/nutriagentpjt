package com.NurtiAgent.Onboard.meal.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
import com.NurtiAgent.Onboard.meal.dto.*;
import com.NurtiAgent.Onboard.meal.service.MealService;
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
            @GuestId String guestId,
            @Valid @RequestBody MealRequest request) {
        MealResponse response = mealService.createMeal(guestId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<MealListResponse> getMealsByDate(
            @GuestId String guestId,
            @RequestParam String date) {
        MealListResponse response = mealService.getMealsByDate(guestId, date);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{mealId}")
    public ResponseEntity<MealResponse> updateMeal(
            @GuestId String guestId,
            @PathVariable Long mealId,
            @Valid @RequestBody MealUpdateRequest request) {
        MealResponse response = mealService.updateMeal(guestId, mealId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{mealId}")
    public ResponseEntity<MealDeleteResponse> deleteMeal(
            @GuestId String guestId,
            @PathVariable Long mealId) {
        MealDeleteResponse response = mealService.deleteMeal(guestId, mealId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<MealSummaryResponse> getMealSummary(
            @GuestId String guestId,
            @RequestParam String date) {
        MealSummaryResponse response = mealService.getMealSummary(guestId, date);
        return ResponseEntity.ok(response);
    }
}
