package com.NurtiAgent.Onboard.meal.repository;

import com.NurtiAgent.Onboard.common.enums.MealType;
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

    List<Meal> findByUserAndDateOrderByCreatedAtAsc(User user, LocalDate date);

    Optional<Meal> findByIdAndUser(Long id, User user);

    @Query("SELECT m FROM Meal m WHERE m.user = :user AND m.date = :date")
    List<Meal> findByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("SELECT m FROM Meal m WHERE m.user = :user AND m.date = :date AND m.mealType = :mealType")
    List<Meal> findByUserAndDateAndMealType(@Param("user") User user, @Param("date") LocalDate date, @Param("mealType") MealType mealType);
}
