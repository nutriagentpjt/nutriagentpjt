package com.NurtiAgent.Onboard.common.enums;

public enum ExerciseTime {
    MORNING("오전"),
    AFTERNOON("오후"),
    EVENING("저녁"),
    NIGHT("밤");

    private final String description;

    ExerciseTime(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
