package com.NurtiAgent.Onboard.assistant.dto;

import java.time.LocalDateTime;

public record FastApiSessionResponse(
        Integer id,
        String guest_id,
        String persona,
        String title,
        LocalDateTime created_at,
        LocalDateTime updated_at
) {
    public String guestId() {
        return guest_id;
    }

    public LocalDateTime createdAt() {
        return created_at;
    }

    public LocalDateTime updatedAt() {
        return updated_at;
    }
}
