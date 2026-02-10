    package com.NurtiAgent.Onboard.onboarding.repository;

import com.NurtiAgent.Onboard.onboarding.entity.OnboardingInfo;
import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingInfoRepository extends JpaRepository<OnboardingInfo, Long> {

    Optional<OnboardingInfo> findByUser(User user);

    Optional<OnboardingInfo> findByUserId(Long userId);

    boolean existsByUser(User user);
}
