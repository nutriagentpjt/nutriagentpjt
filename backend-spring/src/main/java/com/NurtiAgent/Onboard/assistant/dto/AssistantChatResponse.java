package com.NurtiAgent.Onboard.assistant.dto;

public record AssistantChatResponse(
        String threadId,
        AssistantMessage message
) {
    public record AssistantMessage(
            String role,
            String content
    ) {}
}
