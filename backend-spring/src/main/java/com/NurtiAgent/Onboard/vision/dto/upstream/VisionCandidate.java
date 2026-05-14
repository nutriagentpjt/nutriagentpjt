package com.NurtiAgent.Onboard.vision.dto.upstream;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VisionCandidate(
        int rank,
        @JsonProperty("food_id") Integer foodId,
        @JsonProperty("food_name") String foodName,
        Double similarity,
        VisionNutrition nutrition
) {}
