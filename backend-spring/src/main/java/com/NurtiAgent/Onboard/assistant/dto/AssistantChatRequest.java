package com.NurtiAgent.Onboard.assistant.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record AssistantChatRequest(
        @NotBlank String message,
        String threadId,
        String persona,
        List<ChatHistoryItem> messages
) {
    public record ChatHistoryItem(
            String role,
            String content
    ) {}
}
