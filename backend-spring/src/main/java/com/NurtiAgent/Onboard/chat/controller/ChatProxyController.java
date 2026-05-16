package com.NurtiAgent.Onboard.chat.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
public class ChatProxyController {

    private final RestTemplate restTemplate;
    private final RestTemplate chatRestTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.base-url}")
    private String fastapiBaseUrl;

    @Value("${fastapi.internal-key}")
    private String internalApiKey;

    public ChatProxyController(RestTemplate restTemplate,
                               @Qualifier("chatRestTemplate") RestTemplate chatRestTemplate,
                               ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.chatRestTemplate = chatRestTemplate;
        this.objectMapper = objectMapper;
    }

    // ─────────────────────────────────────────────
    // GET /api/v1/chat/personas
    // ─────────────────────────────────────────────
    @GetMapping("/personas")
    public ResponseEntity<String> getPersonas() {
        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/personas")
                .toUriString();

        return proxy(() -> restTemplate.exchange(url, HttpMethod.GET,
                new HttpEntity<>(buildInternalHeaders()), String.class));
    }

    // ─────────────────────────────────────────────
    // POST /api/v1/chat/sessions
    // guest_id를 세션에서 꺼내 body에 주입
    // ─────────────────────────────────────────────
    @PostMapping("/sessions")
    public ResponseEntity<String> createSession(
            @GuestId String guestId,
            @RequestBody Map<String, Object> body) {

        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/sessions")
                .toUriString();

        Map<String, Object> requestBody = new HashMap<>(body);
        requestBody.put("guest_id", guestId);

        HttpHeaders headers = buildJsonHeaders();
        return proxy(() -> restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(requestBody, headers), String.class));
    }

    // ─────────────────────────────────────────────
    // GET /api/v1/chat/sessions
    // guest_id를 쿼리파라미터로 전달
    // ─────────────────────────────────────────────
    @GetMapping("/sessions")
    public ResponseEntity<String> getSessions(@GuestId String guestId) {
        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/sessions")
                .queryParam("guest_id", guestId)
                .toUriString();

        return proxy(() -> restTemplate.exchange(url, HttpMethod.GET,
                new HttpEntity<>(buildGuestHeaders(guestId)), String.class));
    }

    // ─────────────────────────────────────────────
    // GET /api/v1/chat/sessions/{sessionId}/messages
    // X-Guest-Id 헤더로 전달
    // ─────────────────────────────────────────────
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<String> getMessages(
            @GuestId String guestId,
            @PathVariable Long sessionId) {

        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/sessions/{sessionId}/messages")
                .buildAndExpand(sessionId)
                .toUriString();

        HttpHeaders headers = buildGuestHeaders(guestId);
        return proxy(() -> restTemplate.exchange(url, HttpMethod.GET,
                new HttpEntity<>(headers), String.class));
    }

    // ─────────────────────────────────────────────
    // POST /api/v1/chat/sessions/{sessionId}/messages
    // 일반 응답
    // ─────────────────────────────────────────────
    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<String> sendMessage(
            @GuestId String guestId,
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest servletRequest) {

        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/sessions/{sessionId}/messages")
                .buildAndExpand(sessionId)
                .toUriString();

        HttpHeaders headers = buildGuestHeaders(guestId);
        headers.setContentType(MediaType.APPLICATION_JSON);
        forwardSessionCookie(servletRequest, headers);

        return proxy(() -> restTemplate.exchange(url, HttpMethod.POST,
                new HttpEntity<>(body, headers), String.class));
    }

    // ─────────────────────────────────────────────
    // POST /api/v1/chat/sessions/{sessionId}/messages/stream
    // SSE 스트리밍 - FastAPI → Bedrock converse_stream 결과를 바이트 단위로 포워딩
    // ─────────────────────────────────────────────
    @PostMapping(value = "/sessions/{sessionId}/messages/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> streamMessage(
            @GuestId String guestId,
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest servletRequest) {

        String url = UriComponentsBuilder
                .fromUriString(fastapiBaseUrl)
                .path("/api/v1/chat/sessions/{sessionId}/messages/stream")
                .buildAndExpand(sessionId)
                .toUriString();

        String sessionId_ = servletRequest.getRequestedSessionId();

        StreamingResponseBody stream = outputStream -> {
            try {
                chatRestTemplate.execute(
                        url,
                        HttpMethod.POST,
                        request -> {
                            request.getHeaders().set("X-Guest-Id", guestId);
                            request.getHeaders().set("X-Internal-Key", internalApiKey);
                            request.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                            if (sessionId_ != null) {
                                request.getHeaders().set(HttpHeaders.COOKIE, "JSESSIONID=" + sessionId_);
                            }
                            byte[] json = objectMapper.writeValueAsBytes(body);
                            request.getBody().write(json);
                        },
                        response -> {
                            try (InputStream is = response.getBody()) {
                                byte[] buf = new byte[4096];
                                int n;
                                while ((n = is.read(buf)) != -1) {
                                    try {
                                        outputStream.write(buf, 0, n);
                                        outputStream.flush();
                                    } catch (AsyncRequestNotUsableException e) {
                                        log.debug("SSE 클라이언트 연결 종료 sessionId={}", sessionId);
                                        break;
                                    }
                                }
                            }
                            return null;
                        }
                );
            } catch (AsyncRequestNotUsableException e) {
                log.debug("SSE async request 완료 후 write 시도 sessionId={}", sessionId);
            } catch (Exception e) {
                log.error("SSE 스트리밍 오류 sessionId={}", sessionId, e);
                try {
                    String errorEvent = "data: {\"type\":\"error\",\"message\":\"스트리밍 오류가 발생했습니다\"}\n\n";
                    outputStream.write(errorEvent.getBytes());
                    outputStream.flush();
                } catch (Exception ignored) {}
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(stream);
    }

    // ─────────────────────────────────────────────
    // FastAPI 4xx/5xx → 원래 status/body 그대로 반환
    // ─────────────────────────────────────────────
    private ResponseEntity<String> proxy(java.util.concurrent.Callable<ResponseEntity<String>> call) {
        try {
            return call.call();
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("FastAPI 호출 오류", e);
            return ResponseEntity.internalServerError().body("{\"error\":\"upstream 호출 실패\"}");
        }
    }

    // ─────────────────────────────────────────────
    // 공통 헤더 빌더
    // ─────────────────────────────────────────────
    private HttpHeaders buildInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Key", internalApiKey);
        return headers;
    }

    private HttpHeaders buildJsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Key", internalApiKey);
        return headers;
    }

    private HttpHeaders buildGuestHeaders(String guestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Guest-Id", guestId);
        headers.set("X-Internal-Key", internalApiKey);
        return headers;
    }

    // 브라우저의 JSESSIONID를 FastAPI로 전달 (FastAPI → Spring tool 콜백용)
    private void forwardSessionCookie(HttpServletRequest servletRequest, HttpHeaders headers) {
        String jsessionid = servletRequest.getRequestedSessionId();
        if (jsessionid != null) {
            headers.set(HttpHeaders.COOKIE, "JSESSIONID=" + jsessionid);
        }
    }
}
