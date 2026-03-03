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
public class MealItemResponse {

    private Long id;
    private String foodName;
    private Double amount;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private MealType mealType;
    private LocalDateTime createdAt;
}
