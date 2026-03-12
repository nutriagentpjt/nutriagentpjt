package com.NurtiAgent.Onboard.profile.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionTargetUpdateRequest {

    @NotNull(message = "목표 칼로리는 필수입니다")
    @DecimalMin(value = "500.0", message = "목표 칼로리는 최소 500kcal 이상이어야 합니다")
    private Double calories;

    @NotNull(message = "목표 단백질은 필수입니다")
    @DecimalMin(value = "0.0", message = "목표 단백질은 0 이상이어야 합니다")
    private Double protein;

    @NotNull(message = "목표 탄수화물은 필수입니다")
    @DecimalMin(value = "0.0", message = "목표 탄수화물은 0 이상이어야 합니다")
    private Double carbs;

    @NotNull(message = "목표 지방은 필수입니다")
    @DecimalMin(value = "0.0", message = "목표 지방은 0 이상이어야 합니다")
    private Double fat;
}
