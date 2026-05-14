package com.NurtiAgent.Onboard.vision.dto.upstream;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VisionNutrition(
        @JsonProperty("serving_basis") Double servingBasis,
        @JsonProperty("calories_kcal") Double caloriesKcal,
        @JsonProperty("protein_g") Double proteinG,
        @JsonProperty("fat_g") Double fatG,
        @JsonProperty("carbs_g") Double carbsG
) {}
