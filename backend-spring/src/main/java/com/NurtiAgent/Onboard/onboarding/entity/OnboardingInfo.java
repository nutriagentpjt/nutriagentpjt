package com.NurtiAgent.Onboard.onboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import com.NurtiAgent.Onboard.user.entity.User;

@Entity
@Table(name = "onboarding_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 기본 정보
    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    // 신체 정보
    private Double height; // cm

    private Double weight; // kg

    // 건강 목표
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private HealthGoal healthGoal;

    // 활동 수준
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ActivityLevel activityLevel;

    // 운동 정보
    @Column(nullable = false)
    private Integer exerciseFrequency; // 주당 운동 일수 (1~7)

    private String exerciseTime; // 운동 시간대 (예: "오전", "오후", "저녁")

    // 식사 패턴
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MealPattern mealPattern;

    // 음식 선호도 - JSON으로 저장
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferred_foods", columnDefinition = "jsonb")
    private List<String> preferredFoods;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "disliked_foods", columnDefinition = "jsonb")
    private List<String> dislikedFoods;

    // 질환 정보 - JSON으로 저장
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diseases", columnDefinition = "jsonb")
    private List<Disease> diseases;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Enum 타입 정의
    public enum Gender {
        MALE("남성"),
        FEMALE("여성");

        private final String description;

        Gender(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum HealthGoal {
        DIET("다이어트"),
        BULK_UP("벌크업"),
        LEAN_MASS_UP("린매스업");

        private final String description;

        HealthGoal(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum ActivityLevel {
        SEDENTARY("앉아서 일함"),
        LIGHTLY_ACTIVE("보통"),
        MODERATELY_ACTIVE("활동적"),
        VERY_ACTIVE("매우 활동적");

        private final String description;

        ActivityLevel(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum MealPattern {
        TWO_MEALS("2끼"),
        THREE_MEALS("3끼"),
        INTERMITTENT_FASTING("간헐적 단식"),
        MULTIPLE_SMALL_MEALS("소식 다회");

        private final String description;

        MealPattern(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum Disease {
        NONE("없음"),
        ALLERGY("알레르기"),
        DIABETES("당뇨"),
        HYPERTENSION("고혈압"),
        HYPERLIPIDEMIA("고지혈증"),
        GOUT("통풍"),
        KIDNEY_DISEASE("신장 질환"),
        LIVER_DISEASE("간 질환"),
        THYROID_DISEASE("갑상선 질환");

        private final String description;

        Disease(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
