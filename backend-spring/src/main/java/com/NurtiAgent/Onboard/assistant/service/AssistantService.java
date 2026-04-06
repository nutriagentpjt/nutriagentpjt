package com.NurtiAgent.Onboard.assistant.service;

import com.NurtiAgent.Onboard.assistant.dto.AssistantChatRequest;
import com.NurtiAgent.Onboard.assistant.dto.AssistantChatResponse;
import com.NurtiAgent.Onboard.assistant.dto.AssistantMessageHistoryItem;
import com.NurtiAgent.Onboard.assistant.dto.AssistantPersonaResponse;
import com.NurtiAgent.Onboard.assistant.dto.AssistantSessionResponse;
import com.NurtiAgent.Onboard.assistant.dto.FastApiChatMessageRequest;
import com.NurtiAgent.Onboard.assistant.dto.FastApiChatMessageResponse;
import com.NurtiAgent.Onboard.assistant.dto.FastApiCreateSessionRequest;
import com.NurtiAgent.Onboard.assistant.dto.FastApiMessageHistoryItem;
import com.NurtiAgent.Onboard.assistant.dto.FastApiPersonaResponse;
import com.NurtiAgent.Onboard.assistant.dto.FastApiSessionResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private static final String DEFAULT_PERSONA = "strong_strong";

    private final RestTemplate restTemplate;

    @Value("${fastapi.chat.url}")
    private String fastapiChatUrl;

    @Value("${fastapi.internal-key}")
    private String internalApiKey;

    public AssistantChatResponse chat(AssistantChatRequest request, HttpServletRequest servletRequest) {
        SessionContext context = resolveSessionContext(servletRequest);

        Integer sessionId = parseThreadId(request.threadId());
        if (sessionId == null) {
            sessionId = createChatSession(context.guestId(), request.persona());
        }

        String responseText = sendMessage(
                sessionId,
                context.guestId(),
                request.message(),
                context.jsessionId()
        );

        return new AssistantChatResponse(
                String.valueOf(sessionId),
                new AssistantChatResponse.AssistantMessage("assistant", responseText)
        );
    }

    public List<AssistantPersonaResponse> getPersonas() {
        HttpHeaders headers = createInternalHeaders();
        ResponseEntity<FastApiPersonaResponse[]> response = restTemplate.exchange(
                fastapiChatUrl + "/personas",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                FastApiPersonaResponse[].class
        );

        FastApiPersonaResponse[] payload = response.getBody();
        if (payload == null) {
            return List.of();
        }

        return Arrays.stream(payload)
                .map(item -> new AssistantPersonaResponse(item.name(), item.displayName(), item.description()))
                .toList();
    }

    public AssistantSessionResponse createSession(String persona, HttpServletRequest servletRequest) {
        SessionContext context = resolveSessionContext(servletRequest);
        Integer sessionId = createChatSession(context.guestId(), persona);
        return getSessionById(sessionId, servletRequest);
    }

    public List<AssistantSessionResponse> listSessions(HttpServletRequest servletRequest) {
        SessionContext context = resolveSessionContext(servletRequest);
        HttpHeaders headers = createInternalHeaders();

        ResponseEntity<FastApiSessionResponse[]> response = restTemplate.exchange(
                fastapiChatUrl + "/sessions?guest_id=" + context.guestId(),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                FastApiSessionResponse[].class
        );

        FastApiSessionResponse[] payload = response.getBody();
        if (payload == null) {
            return List.of();
        }

        return Arrays.stream(payload)
                .map(this::toAssistantSession)
                .toList();
    }

    public AssistantSessionResponse getSessionById(Integer sessionId, HttpServletRequest servletRequest) {
        return listSessions(servletRequest).stream()
                .filter(session -> session.id().equals(sessionId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("채팅 세션을 찾을 수 없습니다."));
    }

    public List<AssistantMessageHistoryItem> getMessages(Integer sessionId, HttpServletRequest servletRequest) {
        SessionContext context = resolveSessionContext(servletRequest);
        HttpHeaders headers = createInternalHeaders();
        headers.set("X-Guest-Id", context.guestId());

        ResponseEntity<FastApiMessageHistoryItem[]> response = restTemplate.exchange(
                fastapiChatUrl + "/sessions/" + sessionId + "/messages",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                FastApiMessageHistoryItem[].class
        );

        FastApiMessageHistoryItem[] payload = response.getBody();
        if (payload == null) {
            return List.of();
        }

        return Arrays.stream(payload)
                .map(item -> new AssistantMessageHistoryItem(item.id(), item.role(), item.content(), item.createdAt()))
                .toList();
    }

    public StreamingResponseBody streamChat(Integer sessionId, AssistantChatRequest request, HttpServletRequest servletRequest) {
        SessionContext context = resolveSessionContext(servletRequest);
        HttpHeaders headers = createInternalHeaders();
        headers.set("X-Guest-Id", context.guestId());
        headers.add(HttpHeaders.COOKIE, ResponseCookie.from("JSESSIONID", context.jsessionId()).build().toString());

        HttpEntity<FastApiChatMessageRequest> entity = new HttpEntity<>(
                new FastApiChatMessageRequest(request.message()),
                headers
        );
        RequestCallback requestCallback = restTemplate.httpEntityCallback(entity);

        return outputStream -> restTemplate.execute(
                fastapiChatUrl + "/sessions/" + sessionId + "/messages/stream",
                HttpMethod.POST,
                requestCallback,
                response -> {
                    if (response.getBody() != null) {
                        StreamUtils.copy(response.getBody(), outputStream);
                        outputStream.flush();
                    }
                    return null;
                }
        );
    }

    private Integer createChatSession(String guestId, String persona) {
        HttpHeaders headers = createInternalHeaders();
        FastApiCreateSessionRequest body = new FastApiCreateSessionRequest(
                guestId,
                persona == null || persona.isBlank() ? DEFAULT_PERSONA : persona
        );

        ResponseEntity<FastApiSessionResponse> response = restTemplate.exchange(
                fastapiChatUrl + "/sessions",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                FastApiSessionResponse.class
        );

        FastApiSessionResponse sessionResponse = response.getBody();
        if (sessionResponse == null || sessionResponse.id() == null) {
            throw new IllegalStateException("채팅 세션 생성에 실패했습니다.");
        }

        return sessionResponse.id();
    }

    private String sendMessage(Integer sessionId, String guestId, String message, String jsessionId) {
        HttpHeaders headers = createInternalHeaders();
        headers.set("X-Guest-Id", guestId);
        headers.add(HttpHeaders.COOKIE, ResponseCookie.from("JSESSIONID", jsessionId).build().toString());

        ResponseEntity<FastApiChatMessageResponse> response = restTemplate.exchange(
                fastapiChatUrl + "/sessions/" + sessionId + "/messages",
                HttpMethod.POST,
                new HttpEntity<>(new FastApiChatMessageRequest(message), headers),
                FastApiChatMessageResponse.class
        );

        FastApiChatMessageResponse chatResponse = response.getBody();
        if (chatResponse == null || chatResponse.response() == null) {
            throw new IllegalStateException("AI 응답을 불러오지 못했습니다.");
        }

        return chatResponse.response();
    }

    private AssistantSessionResponse toAssistantSession(FastApiSessionResponse sessionResponse) {
        return new AssistantSessionResponse(
                sessionResponse.id(),
                sessionResponse.guestId(),
                sessionResponse.persona(),
                sessionResponse.title(),
                sessionResponse.createdAt(),
                sessionResponse.updatedAt()
        );
    }

    private HttpHeaders createInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Key", internalApiKey);
        return headers;
    }

    private SessionContext resolveSessionContext(HttpServletRequest servletRequest) {
        HttpSession session = servletRequest.getSession(false);
        if (session == null) {
            throw new IllegalStateException("세션이 존재하지 않습니다.");
        }

        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null || guestId.isBlank()) {
            throw new IllegalStateException("게스트 세션이 유효하지 않습니다.");
        }

        return new SessionContext(guestId, session.getId());
    }

    private Integer parseThreadId(String threadId) {
        if (threadId == null || threadId.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(threadId);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private record SessionContext(String guestId, String jsessionId) {}
}
