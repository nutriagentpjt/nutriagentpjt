package com.NurtiAgent.Onboard.vision.dto.upstream;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VisionPrediction(
        @JsonProperty("top1_food_name") String top1FoodName,
        @JsonProperty("top1_similarity") Double top1Similarity
) {}
