package com.NurtiAgent.Onboard.common.enums;

public enum MealPattern {
    TWO_MEALS("2끼"),
    THREE_MEALS("3끼"),
    INTERMITTENT_FASTING("간헐적 단식"),
    MULTIPLE_SMALL_MEALS("소량 다회");

    private final String description;

    MealPattern(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
