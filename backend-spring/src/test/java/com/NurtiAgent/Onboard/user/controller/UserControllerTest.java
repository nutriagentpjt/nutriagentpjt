package com.NurtiAgent.Onboard.user.controller;

import com.NurtiAgent.Onboard.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상:
 *   - POST /guest/session  → guestId 발급
 *   - POST /renew/session  → 세션 갱신
 *
 * 의존성: UserService (@MockBean)
 */
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean  UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==================== POST /guest/session ====================

    @Nested
    @DisplayName("POST /guest/session")
    class IssueGuestSession {

        @Test
        @DisplayName("정상 발급: 200 OK + guestId 반환")
        void normal_returnsGuestId() throws Exception {
            when(userService.saveUser(any())).thenReturn("guest_abc-123");

            mockMvc.perform(post("/guest/session"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("guest_abc-123"));
        }

        @Test
        @DisplayName("saveUser 호출: 1회")
        void saveUser_calledOnce() throws Exception {
            when(userService.saveUser(any())).thenReturn("guest_abc-123");

            mockMvc.perform(post("/guest/session"));

            verify(userService, times(1)).saveUser(any());
        }
    }

    // ==================== POST /renew/session ====================

    @Nested
    @DisplayName("POST /renew/session")
    class RenewSession {

        @Test
        @DisplayName("정상 갱신: 200 OK + 'renew session' 반환")
        void normal_returnsRenewMessage() throws Exception {
            doNothing().when(userService).renewSession(any(), eq("guest_existing-id"));

            String body = objectMapper.writeValueAsString(
                    new com.NurtiAgent.Onboard.user.dto.GuestIdData("guest_existing-id"));

            mockMvc.perform(post("/renew/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(content().string("renew session"));
        }

        @Test
        @DisplayName("존재하지 않는 guestId: 400 BAD_REQUEST (GlobalExceptionHandler)")
        void invalidGuestId_returns400() throws Exception {
            doThrow(new IllegalArgumentException("Invalid guest ID: unknown"))
                    .when(userService).renewSession(any(), eq("unknown"));

            String body = objectMapper.writeValueAsString(
                    new com.NurtiAgent.Onboard.user.dto.GuestIdData("unknown"));

            mockMvc.perform(post("/renew/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }
    }
}
