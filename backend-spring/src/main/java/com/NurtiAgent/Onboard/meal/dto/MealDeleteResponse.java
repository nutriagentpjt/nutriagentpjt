package com.NurtiAgent.Onboard.meal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealDeleteResponse {

    private Boolean success;
    private String message;
}
