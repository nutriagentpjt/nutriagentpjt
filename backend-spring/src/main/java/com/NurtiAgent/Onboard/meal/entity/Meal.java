package com.NurtiAgent.Onboard.meal.entity;

import com.NurtiAgent.Onboard.common.enums.MealSource;
import com.NurtiAgent.Onboard.common.enums.MealType;
import com.NurtiAgent.Onboard.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String foodName; // 음식명

    @Column(nullable = false)
    private Double amount; // 섭취량 (g)

    @Column(nullable = false)
    private Double calories; // 계산된 칼로리 (kcal)

    private Double protein; // 계산된 단백질 (g)

    private Double carbs; // 계산된 탄수화물 (g)

    private Double fat; // 계산된 지방 (g)

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MealType mealType; // 식사 시간대

    @Column(nullable = false)
    private LocalDate date; // 식사 날짜

    @Enumerated(EnumType.STRING)
    private MealSource source; // 기록 출처 (추천/직접입력)

    private String setId; // 추천 세트 ID (UUID)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (source == null) {
            source = MealSource.MANUAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
