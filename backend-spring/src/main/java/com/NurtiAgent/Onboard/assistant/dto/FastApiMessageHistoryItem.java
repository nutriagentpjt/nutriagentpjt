package com.NurtiAgent.Onboard.assistant.dto;

import java.time.LocalDateTime;

public record FastApiMessageHistoryItem(
        Integer id,
        String role,
        String content,
        LocalDateTime created_at
) {
    public LocalDateTime createdAt() {
        return created_at;
    }
}
