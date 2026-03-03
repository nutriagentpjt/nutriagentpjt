package com.NurtiAgent.Onboard.meal.repository;

import com.NurtiAgent.Onboard.meal.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

    // 음식명으로 검색 (최대 20개)
    @Query("SELECT f FROM Food f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY f.name")
    List<Food> searchByKeyword(@Param("keyword") String keyword);
}
