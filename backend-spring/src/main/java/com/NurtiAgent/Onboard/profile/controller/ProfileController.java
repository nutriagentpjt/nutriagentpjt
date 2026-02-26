package com.NurtiAgent.Onboard.profile.controller;

import com.NurtiAgent.Onboard.profile.dto.*;
import com.NurtiAgent.Onboard.profile.service.ProfileService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/onboarding")
    public ResponseEntity<OnboardingResponse> saveOnboarding(
            HttpSession session,
            @Valid @RequestBody OnboardingRequest request) {
        // 세션에서 guestId 추출 (임시로 "GUEST_ID"라는 속성명 사용)
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OnboardingResponse response = profileService.saveOnboarding(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(HttpSession session) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProfileResponse response = profileService.getProfile(guestId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            HttpSession session,
            @Valid @RequestBody ProfileUpdateRequest request) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProfileResponse response = profileService.updateProfile(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profiles/targets")
    public ResponseEntity<NutritionTargetResponse> getNutritionTargets(HttpSession session) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        NutritionTargetResponse response = profileService.getNutritionTargets(guestId);
        return ResponseEntity.ok(response);
    }
}
