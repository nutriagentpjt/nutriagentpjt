package com.NurtiAgent.Onboard.assistant.dto;

import java.time.LocalDateTime;

public record AssistantSessionResponse(
        Integer id,
        String guestId,
        String persona,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
