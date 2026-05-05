package com.NurtiAgent.Onboard.common.enums;

public enum Disease {
    NONE("없음"),
    ALLERGY("알레르기"),
    DIABETES("당뇨병"),
    HYPERTENSION("고혈압"),
    HYPERLIPIDEMIA("고지혈증"),
    GOUT("통풍"),
    KIDNEY_DISEASE("신장 질환"),
    LIVER_DISEASE("간 질환"),
    THYROID_DISEASE("갑상선 질환"),
    HEART_DISEASE("심장 질환"),
    DIGESTIVE_DISORDER("소화기 질환"),
    ANEMIA("빈혈"),
    OSTEOPOROSIS("골다공증");

    private final String description;

    Disease(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
