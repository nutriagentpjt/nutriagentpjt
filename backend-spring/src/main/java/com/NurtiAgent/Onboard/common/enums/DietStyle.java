package com.NurtiAgent.Onboard.common.enums;

public enum DietStyle {
    VEGAN("비건 (완전 채식)"),
    VEGETARIAN("채식"),
    KETO("케토제닉"),
    LOW_CARB("저탄수화물"),
    LOW_FAT("저지방"),
    HIGH_PROTEIN("고단백"),
    MEDITERRANEAN("지중해식"),
    PALEO("팔레오"),
    GLUTEN_FREE("글루텐 프리"),
    NONE("없음");

    private final String description;

    DietStyle(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
