package com.NurtiAgent.Onboard.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionTargetResponse {

    private TargetDto target;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TargetDto {
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
    }
}
