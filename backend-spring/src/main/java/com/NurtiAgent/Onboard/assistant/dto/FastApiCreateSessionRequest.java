package com.NurtiAgent.Onboard.assistant.dto;

public record FastApiCreateSessionRequest(
        String guest_id,
        String persona
) {}
