package com.NurtiAgent.Onboard.user.repository;

import com.NurtiAgent.Onboard.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGuestId(String guestId);

    boolean existsByGuestId(String guestId);
}
