package com.NurtiAgent.Onboard.meal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "foods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private String name; // 음식명

    @NotNull
    @Positive
    @Column(nullable = false)
    private Double weight; // 1회 제공량 (g)

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double calories; // 칼로리 (kcal)

    @PositiveOrZero
    private Double carbs; // 탄수화물 (g)

    @PositiveOrZero
    private Double protein; // 단백질 (g)

    @PositiveOrZero
    private Double fat; // 지방 (g)

    @PositiveOrZero
    private Double sodium; // 나트륨 (mg)

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
