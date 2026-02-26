package com.NurtiAgent.Onboard.profile.entity;

import com.NurtiAgent.Onboard.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "nutrition_targets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 목표 영양소
    @Column(nullable = false)
    private Double calories;  // kcal

    @Column(nullable = false)
    private Double protein;   // g

    @Column(nullable = false)
    private Double carbs;     // g

    @Column(nullable = false)
    private Double fat;       // g

    // 계산 정보
    private Double bmr;       // 기초대사량 (kcal)
    private Double tdee;      // 총 일일 에너지 소비량 (kcal)

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
