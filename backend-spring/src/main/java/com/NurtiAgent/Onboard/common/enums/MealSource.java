package com.NurtiAgent.Onboard.common.enums;

public enum MealSource {
    RECOMMENDATION("추천"),
    MANUAL("직접입력");

    private final String description;

    MealSource(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
