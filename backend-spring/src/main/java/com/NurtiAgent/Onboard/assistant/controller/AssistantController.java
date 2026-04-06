package com.NurtiAgent.Onboard.assistant.controller;

import com.NurtiAgent.Onboard.assistant.dto.AssistantChatRequest;
import com.NurtiAgent.Onboard.assistant.dto.AssistantChatResponse;
import com.NurtiAgent.Onboard.assistant.dto.AssistantMessageHistoryItem;
import com.NurtiAgent.Onboard.assistant.dto.AssistantPersonaResponse;
import com.NurtiAgent.Onboard.assistant.dto.AssistantSessionResponse;
import com.NurtiAgent.Onboard.assistant.service.AssistantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.List;

@RestController
@RequestMapping("/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @GetMapping("/personas")
    public ResponseEntity<List<AssistantPersonaResponse>> getPersonas() {
        return ResponseEntity.ok(assistantService.getPersonas());
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AssistantSessionResponse>> getSessions(HttpServletRequest servletRequest) {
        try {
            return ResponseEntity.ok(assistantService.listSessions(servletRequest));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/sessions")
    public ResponseEntity<AssistantSessionResponse> createSession(
            @RequestBody(required = false) AssistantChatRequest request,
            HttpServletRequest servletRequest
    ) {
        try {
            return ResponseEntity.ok(assistantService.createSession(request != null ? request.persona() : null, servletRequest));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<AssistantMessageHistoryItem>> getMessages(
            @PathVariable Integer sessionId,
            HttpServletRequest servletRequest
    ) {
        try {
            return ResponseEntity.ok(assistantService.getMessages(sessionId, servletRequest));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<AssistantChatResponse> chat(
            @Valid @RequestBody AssistantChatRequest request,
            HttpServletRequest servletRequest
    ) {
        try {
            return ResponseEntity.ok(assistantService.chat(request, servletRequest));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping(value = "/sessions/{sessionId}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> streamChat(
            @PathVariable Integer sessionId,
            @Valid @RequestBody AssistantChatRequest request,
            HttpServletRequest servletRequest
    ) {
        try {
            return ResponseEntity.ok(assistantService.streamChat(sessionId, request, servletRequest));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
