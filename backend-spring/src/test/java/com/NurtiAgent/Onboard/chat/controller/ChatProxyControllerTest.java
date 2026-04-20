package com.NurtiAgent.Onboard.chat.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;

/**
 * ChatProxyController 슬라이스 테스트 (@WebMvcTest)
 *
 * 테스트 대상:
 *   - GET  /api/v1/chat/personas
 *   - POST /api/v1/chat/sessions
 *   - GET  /api/v1/chat/sessions
 *   - GET  /api/v1/chat/sessions/{sessionId}/messages
 *   - POST /api/v1/chat/sessions/{sessionId}/messages
 *   - POST /api/v1/chat/sessions/{sessionId}/messages/stream  (SSE)
 *
 * 검증 항목:
 *   - 세션 없으면 401
 *   - guest_id / X-Guest-Id / X-Internal-Key 가 FastAPI로 정상 전달되는지
 *   - SSE 응답 Content-Type 이 text/event-stream 인지
 *   - SSE payload 가 relay 되는지
 */
@WebMvcTest(ChatProxyController.class)
@Import(ChatProxyControllerTest.MockConfig.class)
@TestPropertySource(properties = {
        "fastapi.base-url=http://mock-fastapi:8000",
        "fastapi.internal-key=test-internal-key"
})
class ChatProxyControllerTest {

    @Autowired MockMvc mockMvc;

    @Autowired RestTemplate restTemplate;

    @Autowired
    @Qualifier("chatRestTemplate")
    RestTemplate chatRestTemplate;

    private static final String GUEST_ID = "guest_test-001";
    private static final String INTERNAL_KEY = "test-internal-key";
    private static final String FASTAPI_BASE = "http://mock-fastapi:8000";

    private MockHttpSession authSession;

    @TestConfiguration
    static class MockConfig {
        @Bean
        @Primary
        public RestTemplate restTemplate() {
            return mock(RestTemplate.class);
        }

        @Bean("chatRestTemplate")
        public RestTemplate chatRestTemplate() {
            return mock(RestTemplate.class);
        }
    }

    @BeforeEach
    void setUp() {
        authSession = new MockHttpSession();
        authSession.setAttribute("GUEST_ID", GUEST_ID);
        reset(restTemplate, chatRestTemplate);
    }

    // ═══════════════════════════════════════════════
    // GET /api/v1/chat/personas
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("GET /api/v1/chat/personas")
    class GetPersonas {

        @Test
        @DisplayName("정상 요청: FastAPI 응답 그대로 반환")
        void normal_returnsPersonas() throws Exception {
            String fastapiResponse = "[{\"name\":\"friendly_pt\",\"display_name\":\"친절한 PT\"}]";
            when(restTemplate.exchange(
                    contains("/api/v1/chat/personas"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(String.class)
            )).thenReturn(ResponseEntity.ok(fastapiResponse));

            mockMvc.perform(get("/api/v1/chat/personas"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(fastapiResponse));
        }

        @Test
        @DisplayName("인증 없이 접근 가능 (세션 불필요)")
        void noSession_stillReturns200() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("[]"));

            mockMvc.perform(get("/api/v1/chat/personas"))
                    .andExpect(status().isOk());
        }
    }

    // ═══════════════════════════════════════════════
    // POST /api/v1/chat/sessions
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("POST /api/v1/chat/sessions")
    class CreateSession {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(post("/api/v1/chat/sessions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"persona\":\"friendly_pt\"}"))
                    .andExpect(status().isUnauthorized());

            verify(restTemplate, never()).exchange(anyString(), any(), any(), eq(String.class));
        }

        @Test
        @DisplayName("guest_id가 request body에 주입됨")
        void guestId_injectedIntoBody() throws Exception {
            when(restTemplate.exchange(
                    anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)
            )).thenReturn(ResponseEntity.ok("{\"id\":1}"));

            mockMvc.perform(post("/api/v1/chat/sessions")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"persona\":\"friendly_pt\"}"))
                    .andExpect(status().isOk());

            @SuppressWarnings("unchecked")
            ArgumentCaptor<HttpEntity<Object>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            HttpEntity<Object> captured = captor.getValue();
            assertThat(captured.getBody().toString()).contains(GUEST_ID);
            assertThat(captured.getHeaders().getFirst("X-Internal-Key")).isEqualTo(INTERNAL_KEY);
        }

        @Test
        @DisplayName("FastAPI URL이 올바르게 구성됨")
        void url_isCorrect() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("{\"id\":1}"));

            mockMvc.perform(post("/api/v1/chat/sessions")
                    .session(authSession)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"persona\":\"friendly_pt\"}"));

            verify(restTemplate).exchange(
                    eq(FASTAPI_BASE + "/api/v1/chat/sessions"),
                    eq(HttpMethod.POST), any(), eq(String.class));
        }
    }

    // ═══════════════════════════════════════════════
    // GET /api/v1/chat/sessions
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("GET /api/v1/chat/sessions")
    class GetSessions {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/api/v1/chat/sessions"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("guest_id가 쿼리파라미터로 전달됨")
        void guestId_asQueryParam() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("[]"));

            mockMvc.perform(get("/api/v1/chat/sessions").session(authSession))
                    .andExpect(status().isOk());

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            verify(restTemplate).exchange(urlCaptor.capture(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));

            assertThat(urlCaptor.getValue()).contains("guest_id=" + GUEST_ID);
        }
    }

    // ═══════════════════════════════════════════════
    // GET /api/v1/chat/sessions/{sessionId}/messages
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("GET /api/v1/chat/sessions/{sessionId}/messages")
    class GetMessages {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(get("/api/v1/chat/sessions/1/messages"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("X-Guest-Id 와 X-Internal-Key 헤더가 전달됨")
        void headers_forwarded() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("[]"));

            mockMvc.perform(get("/api/v1/chat/sessions/1/messages").session(authSession))
                    .andExpect(status().isOk());

            @SuppressWarnings("unchecked")
            ArgumentCaptor<HttpEntity<Void>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.GET), captor.capture(), eq(String.class));

            HttpHeaders headers = captor.getValue().getHeaders();
            assertThat(headers.getFirst("X-Guest-Id")).isEqualTo(GUEST_ID);
            assertThat(headers.getFirst("X-Internal-Key")).isEqualTo(INTERNAL_KEY);
        }

        @Test
        @DisplayName("FastAPI URL에 sessionId가 포함됨")
        void url_containsSessionId() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("[]"));

            mockMvc.perform(get("/api/v1/chat/sessions/42/messages").session(authSession));

            verify(restTemplate).exchange(
                    eq(FASTAPI_BASE + "/api/v1/chat/sessions/42/messages"),
                    eq(HttpMethod.GET), any(), eq(String.class));
        }
    }

    // ═══════════════════════════════════════════════
    // POST /api/v1/chat/sessions/{sessionId}/messages
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("POST /api/v1/chat/sessions/{sessionId}/messages")
    class SendMessage {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(post("/api/v1/chat/sessions/1/messages")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("X-Guest-Id 와 X-Internal-Key 헤더가 전달됨")
        void headers_forwarded() throws Exception {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(ResponseEntity.ok("{\"id\":10}"));

            mockMvc.perform(post("/api/v1/chat/sessions/1/messages")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(status().isOk());

            @SuppressWarnings("unchecked")
            ArgumentCaptor<HttpEntity<Object>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

            HttpHeaders headers = captor.getValue().getHeaders();
            assertThat(headers.getFirst("X-Guest-Id")).isEqualTo(GUEST_ID);
            assertThat(headers.getFirst("X-Internal-Key")).isEqualTo(INTERNAL_KEY);
        }
    }

    // ═══════════════════════════════════════════════
    // POST /api/v1/chat/sessions/{sessionId}/messages/stream  (SSE)
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("POST /api/v1/chat/sessions/{sessionId}/messages/stream")
    class StreamMessage {

        @Test
        @DisplayName("세션 없음: 401 UNAUTHORIZED")
        void withoutSession_returns401() throws Exception {
            mockMvc.perform(post("/api/v1/chat/sessions/1/messages/stream")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("응답 Content-Type이 text/event-stream")
        void response_isEventStream() throws Exception {
            stubSseResponse("data: {\"type\":\"done\"}\n\n");

            mockMvc.perform(post("/api/v1/chat/sessions/1/messages/stream")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CONTENT_TYPE,
                            org.hamcrest.Matchers.containsString(MediaType.TEXT_EVENT_STREAM_VALUE)));
        }

        @Test
        @DisplayName("FastAPI SSE payload가 그대로 relay됨")
        void ssePayload_isRelayed() throws Exception {
            String ssePayload = "data: {\"type\":\"content\",\"text\":\"안녕\"}\n\n"
                    + "data: {\"type\":\"done\"}\n\n";
            stubSseResponse(ssePayload);

            MvcResult mvcResult = mockMvc.perform(post("/api/v1/chat/sessions/1/messages/stream")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(request().asyncStarted())
                    .andReturn();

            byte[] bytes = mockMvc.perform(asyncDispatch(mvcResult))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse().getContentAsByteArray();

            assertThat(new String(bytes, StandardCharsets.UTF_8)).isEqualTo(ssePayload);
        }

        @Test
        @DisplayName("chatRestTemplate.execute 호출 시 X-Guest-Id, X-Internal-Key 헤더 설정됨")
        void headers_setInStreamRequest() throws Exception {
            HttpHeaders[] capturedHeaders = new HttpHeaders[1];

            doAnswer(inv -> {
                RequestCallback rc = inv.getArgument(2);
                ResponseExtractor<?> re = inv.getArgument(3);

                ClientHttpRequest mockReq = mock(ClientHttpRequest.class);
                HttpHeaders reqHeaders = new HttpHeaders();
                capturedHeaders[0] = reqHeaders;
                when(mockReq.getHeaders()).thenReturn(reqHeaders);
                when(mockReq.getBody()).thenReturn(new ByteArrayOutputStream());
                rc.doWithRequest(mockReq);

                ClientHttpResponse mockResp = mock(ClientHttpResponse.class);
                when(mockResp.getBody()).thenReturn(
                        new ByteArrayInputStream("data: {\"type\":\"done\"}\n\n".getBytes(StandardCharsets.UTF_8)));
                re.extractData(mockResp);

                return null;
            }).when(chatRestTemplate).execute(anyString(), eq(HttpMethod.POST), any(), any());

            MvcResult mvcResult = mockMvc.perform(post("/api/v1/chat/sessions/1/messages/stream")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(request().asyncStarted())
                    .andReturn();

            mockMvc.perform(asyncDispatch(mvcResult)).andExpect(status().isOk());

            assertThat(capturedHeaders[0]).isNotNull();
            assertThat(capturedHeaders[0].getFirst("X-Guest-Id")).isEqualTo(GUEST_ID);
            assertThat(capturedHeaders[0].getFirst("X-Internal-Key")).isEqualTo(INTERNAL_KEY);
        }

        @Test
        @DisplayName("FastAPI 오류 시 error event 반환 (HTTP 200 유지)")
        void fastapiError_returnsErrorEvent() throws Exception {
            doThrow(new RuntimeException("FastAPI 연결 실패"))
                    .when(chatRestTemplate).execute(anyString(), eq(HttpMethod.POST), any(), any());

            MvcResult mvcResult = mockMvc.perform(post("/api/v1/chat/sessions/1/messages/stream")
                            .session(authSession)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"안녕\"}"))
                    .andExpect(request().asyncStarted())
                    .andReturn();

            String body = mockMvc.perform(asyncDispatch(mvcResult))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse().getContentAsString();

            assertThat(body).contains("\"type\":\"error\"");
        }

        // ─── Helper ───

        private void stubSseResponse(String ssePayload) throws Exception {
            doAnswer(inv -> {
                RequestCallback rc = inv.getArgument(2);
                ResponseExtractor<?> re = inv.getArgument(3);

                ClientHttpRequest mockReq = mock(ClientHttpRequest.class);
                when(mockReq.getHeaders()).thenReturn(new HttpHeaders());
                when(mockReq.getBody()).thenReturn(new ByteArrayOutputStream());
                rc.doWithRequest(mockReq);

                ClientHttpResponse mockResp = mock(ClientHttpResponse.class);
                when(mockResp.getBody()).thenReturn(
                        new ByteArrayInputStream(ssePayload.getBytes(StandardCharsets.UTF_8)));
                re.extractData(mockResp);

                return null;
            }).when(chatRestTemplate).execute(anyString(), eq(HttpMethod.POST), any(), any());
        }
    }
}
