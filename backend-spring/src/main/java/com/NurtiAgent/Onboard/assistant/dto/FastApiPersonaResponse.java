package com.NurtiAgent.Onboard.assistant.dto;

public record FastApiPersonaResponse(
        String name,
        String display_name,
        String description
) {
    public String displayName() {
        return display_name;
    }
}
