package com.NurtiAgent.Onboard.meal.dto;

import com.NurtiAgent.Onboard.common.enums.MealSource;
import com.NurtiAgent.Onboard.common.enums.MealType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealRequest {

    @NotNull(message = "음식 ID를 입력해주세요")
    private Long foodId;

    @NotNull(message = "섭취량을 입력해주세요")
    @DecimalMin(value = "1.0", message = "섭취량은 1g 이상이어야 합니다")
    @DecimalMax(value = "10000.0", message = "섭취량은 10,000g 이하여야 합니다")
    private Double amount;

    @NotNull(message = "식사 시간대를 선택해주세요")
    private MealType mealType;

    @NotNull(message = "날짜를 입력해주세요")
    private LocalDate date;

    private MealSource source; // RECOMMENDATION 또는 MANUAL

    private String setId; // 추천 세트 ID (UUID)
}
