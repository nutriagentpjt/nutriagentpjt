package com.NurtiAgent.Onboard.profile.repository;

import com.NurtiAgent.Onboard.profile.entity.NutritionTarget;
import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NutritionTargetRepository extends JpaRepository<NutritionTarget, Long> {
    Optional<NutritionTarget> findByUser(User user);
}
