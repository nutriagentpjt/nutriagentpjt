package com.NurtiAgent.Onboard.food.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "weight")
    private Double weight;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "protein")
    private Double protein;

    @Column(name = "carbs")
    private Double carbs;

    @Column(name = "fat")
    private Double fat;

    @Column(name = "sodium")
    private Double sodium;

    @Column(name = "saturated_fat")
    private Double saturatedFat;

    @Column(name = "sugar")
    private Double sugars;

    @Column(name = "dietary_fiber")
    private Double fiber;

    @Column(name = "cholesterol")
    private Double cholesterol;

    @Column(name = "trans_fat")
    private Double transFat;

    @Column(name = "potassium")
    private Double potassium;

    @Column(name = "purine_level", length = 10)
    private String purineLevel;

    @Column(name = "iodine")
    private Double iodine;

    @Column(name = "selenium")
    private Double selenium;
}
