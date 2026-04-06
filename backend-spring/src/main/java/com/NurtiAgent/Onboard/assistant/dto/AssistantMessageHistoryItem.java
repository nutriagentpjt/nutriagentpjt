package com.NurtiAgent.Onboard.assistant.dto;

import java.time.LocalDateTime;

public record AssistantMessageHistoryItem(
        Integer id,
        String role,
        String content,
        LocalDateTime createdAt
) {}
