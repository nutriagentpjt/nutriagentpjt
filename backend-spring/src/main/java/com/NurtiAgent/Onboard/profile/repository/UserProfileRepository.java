package com.NurtiAgent.Onboard.profile.repository;

import com.NurtiAgent.Onboard.profile.entity.UserProfile;
import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);
    boolean existsByUser(User user);
}
