package com.NurtiAgent.Onboard.profile.entity;

import com.NurtiAgent.Onboard.common.enums.*;
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
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

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
    @Column(nullable = false)
    private Double height; // cm

    @Column(nullable = false)
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
    private Integer exerciseFrequency; // 주당 운동 빈도 (1~7)

    @Enumerated(EnumType.STRING)
    private ExerciseTime exerciseTime; // 운동 시간대

    // 질환 정보 - JSON 배열로 저장
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diseases", columnDefinition = "jsonb")
    private List<Disease> diseases;

    // 온보딩 완료 여부
    @Column(nullable = false)
    @Builder.Default
    private Boolean onboardingCompleted = false;

    @Column(nullable = false, updatable = false)
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
}
