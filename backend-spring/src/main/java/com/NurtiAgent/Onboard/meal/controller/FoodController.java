package com.NurtiAgent.Onboard.meal.controller;

import com.NurtiAgent.Onboard.meal.dto.FoodSearchResponse;
import com.NurtiAgent.Onboard.meal.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping("/search")
    public ResponseEntity<FoodSearchResponse> searchFoods(@RequestParam String keyword) {
        FoodSearchResponse response = foodService.searchFoods(keyword);
        return ResponseEntity.ok(response);
    }
}
