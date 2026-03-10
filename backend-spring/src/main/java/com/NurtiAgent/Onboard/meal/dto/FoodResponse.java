package com.NurtiAgent.Onboard.meal.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodResponse {

    private String name;
    private Double calories;
    private Double carbs;
    private Double protein;
    private Double fat;
    private Double sodium;
    private Double sugars;
    private Double fiber;
    private Double cholesterol;

    @JsonProperty("saturated_fat")
    private Double saturatedFat;

    @JsonProperty("trans_fat")
    private Double transFat;

    private Integer variants; // 동일 이름 음식의 변종 개수
}
