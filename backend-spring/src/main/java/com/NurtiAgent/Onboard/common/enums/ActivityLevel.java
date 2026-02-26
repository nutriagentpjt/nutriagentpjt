package com.NurtiAgent.Onboard.common.enums;

public enum ActivityLevel {
    SEDENTARY("앉아서 일함"),
    LIGHTLY_ACTIVE("가벼운 활동"),
    MODERATELY_ACTIVE("보통 활동"),
    VERY_ACTIVE("매우 활동적");

    private final String description;

    ActivityLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
