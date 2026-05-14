package com.NurtiAgent.Onboard.vision.dto.upstream;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VisionSearchResponse(
        boolean matched,
        VisionPrediction prediction,
        List<VisionCandidate> candidates
) {}
