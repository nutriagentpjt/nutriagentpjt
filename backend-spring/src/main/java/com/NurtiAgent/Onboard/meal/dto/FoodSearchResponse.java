package com.NurtiAgent.Onboard.meal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodSearchResponse {

    private List<FoodResponse> foods;
    private Integer total;
}
