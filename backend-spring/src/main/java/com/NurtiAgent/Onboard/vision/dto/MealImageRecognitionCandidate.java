package com.NurtiAgent.Onboard.vision.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MealImageRecognitionCandidate(
        Integer id,
        String name,
        String brand,
        Double confidence,
        Double calories,
        Double carbs,
        Double protein,
        Double fat,
        Double servingSize,
        String servingUnit
) {}
