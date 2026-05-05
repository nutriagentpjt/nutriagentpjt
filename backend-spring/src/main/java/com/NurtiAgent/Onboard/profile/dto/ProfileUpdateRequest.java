package com.NurtiAgent.Onboard.profile.dto;

import com.NurtiAgent.Onboard.common.enums.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    @Min(value = 1, message = "나이는 1 이상이어야 합니다")
    @Max(value = 150, message = "나이는 150 이하여야 합니다")
    private Integer age;

    private Gender gender;

    @DecimalMin(value = "50.0", message = "키는 50.0 이상이어야 합니다")
    @DecimalMax(value = "250.0", message = "키는 250.0 이하여야 합니다")
    private Double height;

    @DecimalMin(value = "20.0", message = "몸무게는 20.0 이상이어야 합니다")
    @DecimalMax(value = "350.0", message = "몸무게는 350.0 이하여야 합니다")
    private Double weight;

    private HealthGoal healthGoal;

    private ActivityLevel activityLevel;

    @Min(value = 1, message = "운동 빈도는 최소 1일입니다")
    @Max(value = 7, message = "운동 빈도는 최대 7일입니다")
    private Integer exerciseFrequency;

    private ExerciseTime exerciseTime;

    private List<Disease> diseases;
}
