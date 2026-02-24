package com.NurtiAgent.Onboard.onboarding.controller;

import com.NurtiAgent.Onboard.onboarding.dto.OnboardingRequest;
import com.NurtiAgent.Onboard.onboarding.dto.OnboardingResponse;
import com.NurtiAgent.Onboard.onboarding.service.OnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping
    public ResponseEntity<OnboardingResponse> saveOnboardingInfo(
            HttpServletRequest request,
            @Valid @RequestBody OnboardingRequest onboardingRequest) {
        OnboardingResponse response = onboardingService.saveOnboardingInfo(request, onboardingRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<OnboardingResponse> getOnboardingInfo(HttpServletRequest request) {
        OnboardingResponse response = onboardingService.getOnboardingInfo(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<String> deleteOnboardingInfo(HttpServletRequest request) {
        onboardingService.deleteOnboardingInfo(request);
        return ResponseEntity.ok("온보딩 정보가 삭제되었습니다.");
    }
}
