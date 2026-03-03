package com.NurtiAgent.Onboard.meal.repository;

import com.NurtiAgent.Onboard.meal.entity.Meal;
import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    // 특정 날짜의 식단 기록 조회
    List<Meal> findByUserAndDateOrderByCreatedAtAsc(User user, LocalDate date);

    // 사용자의 특정 식단 기록 조회
    Optional<Meal> findByIdAndUser(Long id, User user);

    // 특정 날짜의 영양소 합계 계산을 위한 조회
    @Query("SELECT m FROM Meal m WHERE m.user = :user AND m.date = :date")
    List<Meal> findByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);
}
