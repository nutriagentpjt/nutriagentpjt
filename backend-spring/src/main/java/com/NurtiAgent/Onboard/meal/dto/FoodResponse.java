package com.NurtiAgent.Onboard.meal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodResponse {

    private Long id;
    private String name;
    private Double weight;
    private Double calories;
    private Double carbs;
    private Double protein;
    private Double fat;
    private Double sodium;
}
