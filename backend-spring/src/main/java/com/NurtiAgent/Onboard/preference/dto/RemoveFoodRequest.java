package com.NurtiAgent.Onboard.preference.dto;

import com.NurtiAgent.Onboard.common.enums.FoodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemoveFoodRequest {

    @NotNull(message = "음식 타입은 필수입니다")
    private FoodType type;

    @NotBlank(message = "음식 이름은 필수입니다")
    private String foodName;
}
