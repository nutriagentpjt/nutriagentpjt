package com.NurtiAgent.Onboard.meal.entity;

import jakarta.persistence.*;
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

    @Column(nullable = false)
    private String name; // 음식명

    @Column(nullable = false)
    private Double weight; // 1회 제공량 (g)

    @Column(nullable = false)
    private Double calories; // 칼로리 (kcal)

    private Double carbs; // 탄수화물 (g)

    private Double protein; // 단백질 (g)

    private Double fat; // 지방 (g)

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
