package com.NurtiAgent.Onboard.meal.dto;

import com.NurtiAgent.Onboard.common.enums.MealType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealUpdateRequest {

    @DecimalMin(value = "1.0", message = "섭취량은 1g 이상이어야 합니다")
    @DecimalMax(value = "10000.0", message = "섭취량은 10,000g 이하여야 합니다")
    private Double amount;

    private MealType mealType;

    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "날짜 형식은 YYYY-MM-DD 입니다")
    private String date;
}
