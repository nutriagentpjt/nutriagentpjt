package com.NurtiAgent.Onboard.user.service;

import com.NurtiAgent.Onboard.user.entity.User;
import com.NurtiAgent.Onboard.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * UserService 단위 테스트
 *
 * 테스트 대상:
 *   - saveUser: 신규 User 생성 + 세션 저장
 *   - renewSession: 기존 User 조회 + 세션 갱신
 *   - generateUniqueGuestId: "guest_UUID" 형식, 충돌 시 재시도
 *
 * 의존성: UserRepository (mock), HttpServletRequest / HttpSession (mock)
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private HttpServletRequest request;
    @Mock private HttpSession session;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        // renewSession 에러 경로에서는 getSession 미호출 → lenient로 unnecessary stubbing 경고 방지
        lenient().when(request.getSession(true)).thenReturn(session);
    }

    // ==================== saveUser ====================

    @Nested
    @DisplayName("saveUser")
    class SaveUser {

        @Test
        @DisplayName("정상 저장: guestId가 반환되고 세션에 저장됨")
        void normal_returnsGuestIdAndStoresInSession() {
            when(userRepository.existsByGuestId(anyString())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(1L);
                return u;
            });

            String guestId = userService.saveUser(request);

            assertThat(guestId).startsWith("guest_");
            verify(userRepository).save(any(User.class));
            verify(session).setAttribute("GUEST_ID", guestId);
        }

        @Test
        @DisplayName("저장된 guestId 형식: 'guest_' + UUID")
        void guestIdFormat_startsWithGuestPrefix() {
            when(userRepository.existsByGuestId(anyString())).thenReturn(false);
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            String guestId = userService.saveUser(request);

            assertThat(guestId).matches("guest_[0-9a-f-]{36}");
        }

        @Test
        @DisplayName("guestId 충돌 시 재시도: 두 번째에 고유 ID 생성")
        void collision_retries() {
            // 첫 번째 ID는 충돌, 두 번째는 통과
            when(userRepository.existsByGuestId(anyString()))
                    .thenReturn(true)
                    .thenReturn(false);
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            String guestId = userService.saveUser(request);

            assertThat(guestId).startsWith("guest_");
            // existsByGuestId가 최소 2번 호출되었는지 검증
            verify(userRepository, atLeast(2)).existsByGuestId(anyString());
        }

        @Test
        @DisplayName("User 엔티티에 guestId가 올바르게 설정됨")
        void savedUser_hasCorrectGuestId() {
            when(userRepository.existsByGuestId(anyString())).thenReturn(false);
            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            when(userRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

            String guestId = userService.saveUser(request);

            assertThat(captor.getValue().getGuestId()).isEqualTo(guestId);
        }
    }

    // ==================== renewSession ====================

    @Nested
    @DisplayName("renewSession")
    class RenewSession {

        private User existingUser;

        @BeforeEach
        void setUpUser() {
            existingUser = User.builder()
                    .id(1L).guestId("guest_existing-id")
                    .createdAt(LocalDateTime.now()).lastAccessedAt(LocalDateTime.now())
                    .build();
        }

        @Test
        @DisplayName("정상 갱신: 세션에 guestId 저장 + save 호출")
        void normal_updatesSessionAndSaves() {
            when(userRepository.findByGuestId("guest_existing-id"))
                    .thenReturn(Optional.of(existingUser));
            when(userRepository.save(any())).thenReturn(existingUser);

            userService.renewSession(request, "guest_existing-id");

            verify(userRepository).save(existingUser);
            verify(session).setAttribute("GUEST_ID", "guest_existing-id");
        }

        @Test
        @DisplayName("존재하지 않는 guestId: IllegalArgumentException 발생")
        void unknownGuestId_throwsIllegalArgument() {
            when(userRepository.findByGuestId("invalid-id")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.renewSession(request, "invalid-id"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid-id");
        }

        @Test
        @DisplayName("유효하지 않은 guestId: 세션 저장 없음")
        void unknownGuestId_sessionNotUpdated() {
            when(userRepository.findByGuestId(anyString())).thenReturn(Optional.empty());

            try {
                userService.renewSession(request, "bad-id");
            } catch (IllegalArgumentException ignored) {}

            verify(session, never()).setAttribute(any(), any());
        }
    }
}
