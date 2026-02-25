package com.NurtiAgent.Onboard.profile.repository;

import com.NurtiAgent.Onboard.profile.entity.DietaryPreference;
import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DietaryPreferenceRepository extends JpaRepository<DietaryPreference, Long> {
    Optional<DietaryPreference> findByUser(User user);
}
