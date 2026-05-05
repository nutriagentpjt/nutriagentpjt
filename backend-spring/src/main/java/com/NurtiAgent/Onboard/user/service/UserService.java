package com.NurtiAgent.Onboard.user.service;

import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public String saveUser(HttpServletRequest request) {
        // 고유한 게스트 ID 생성
        String guestId = generateUniqueGuestId();

        // User 엔티티 생성 및 저장
        User user = User.builder()
                .guestId(guestId)
                .build();

        User savedUser = userRepository.save(user);

        // 세션에 guestId 저장
        HttpSession session = request.getSession(true);
        session.setAttribute("GUEST_ID", guestId);

        return guestId;
    }

    @Transactional
    public void renewSession(HttpServletRequest request, String guestId) {
        // 게스트 ID로 사용자 조회
        User user = userRepository.findByGuestId(guestId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid guest ID: " + guestId));

        // lastAccessedAt 업데이트 (@PreUpdate에서 자동 처리)
        userRepository.save(user);

        // 세션 갱신
        HttpSession session = request.getSession(true);
        session.setAttribute("GUEST_ID", guestId);
    }

    private String generateUniqueGuestId() {
        String guestId;
        do {
            guestId = "guest_" + UUID.randomUUID().toString();
        } while (userRepository.existsByGuestId(guestId));
        return guestId;
    }
}
