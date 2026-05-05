package com.NurtiAgent.Onboard.profile.entity;

import com.NurtiAgent.Onboard.common.enums.DietStyle;
import com.NurtiAgent.Onboard.common.enums.MealPattern;
import com.NurtiAgent.Onboard.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "dietary_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietaryPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 식사 패턴
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MealPattern mealPattern;

    // 선호 음식 - JSON 배열
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferred_foods", columnDefinition = "jsonb")
    private List<String> preferredFoods;

    // 비선호 음식 - JSON 배열 (foodName, reason 포함)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "disliked_foods", columnDefinition = "jsonb")
    private List<DislikedFoodItem> dislikedFoods;

    // 알레르기 식품 - JSON 배열
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allergies", columnDefinition = "jsonb")
    private List<String> allergies;

    // 식단 스타일 - JSON 배열
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diet_styles", columnDefinition = "jsonb")
    private List<DietStyle> dietStyles;

    // 물 섭취 목표 (리터)
    private Double waterIntakeGoal;

    // 제약 조건 - JSON 객체
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "constraints", columnDefinition = "jsonb")
    private DietaryConstraints constraints;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 비선호 음식 아이템 (내부 클래스)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DislikedFoodItem {
        private String foodName;
        private String reason; // ALLERGY, DISLIKE, RELIGIOUS, VEGAN 등
    }

    // 제약 조건 (내부 클래스)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DietaryConstraints {
        private Boolean lowSodium;      // 저염 식단
        private Boolean lowSugar;       // 저당 식단
        private Integer maxCaloriesPerMeal;  // 끼니당 최대 칼로리
    }
}
