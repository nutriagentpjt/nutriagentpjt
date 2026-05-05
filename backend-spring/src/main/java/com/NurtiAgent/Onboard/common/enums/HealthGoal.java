package com.NurtiAgent.Onboard.common.enums;

public enum HealthGoal {
    DIET("다이어트"),
    BULK_UP("벌크업"),
    LEAN_MASS_UP("린매스업"),
    MAINTAIN("체중 유지"),
    GENERAL_HEALTH("일반 건강 관리");

    private final String description;

    HealthGoal(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
