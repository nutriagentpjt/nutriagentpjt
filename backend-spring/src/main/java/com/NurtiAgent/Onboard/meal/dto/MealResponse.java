package com.NurtiAgent.Onboard.meal.dto;

import com.NurtiAgent.Onboard.common.enums.MealType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealResponse {

    private Long id;
    private String userId; // guestId
    private String foodName;
    private Double amount;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private MealType mealType;
    private String date; // YYYY-MM-DD 형식
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
