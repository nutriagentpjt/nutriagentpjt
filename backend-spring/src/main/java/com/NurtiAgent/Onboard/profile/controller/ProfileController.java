package com.NurtiAgent.Onboard.profile.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
import com.NurtiAgent.Onboard.profile.dto.*;
import com.NurtiAgent.Onboard.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/api/onboarding")
    public ResponseEntity<OnboardingResponse> saveOnboarding(
            @GuestId String guestId,
            @Valid @RequestBody OnboardingRequest request) {
        OnboardingResponse response = profileService.saveOnboarding(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/profile")
    public ResponseEntity<ProfileResponse> getProfile(@GuestId String guestId) {
        ProfileResponse response = profileService.getProfile(guestId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @GuestId String guestId,
            @Valid @RequestBody ProfileUpdateRequest request) {
        ProfileResponse response = profileService.updateProfile(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/profiles/targets")
    public ResponseEntity<NutritionTargetResponse> getNutritionTargets(@GuestId String guestId) {
        NutritionTargetResponse response = profileService.getNutritionTargets(guestId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/profiles/targets")
    public ResponseEntity<NutritionTargetResponse> updateNutritionTargets(
            @GuestId String guestId,
            @Valid @RequestBody NutritionTargetUpdateRequest request) {
        NutritionTargetResponse response = profileService.updateNutritionTargets(guestId, request);
        return ResponseEntity.ok(response);
    }
}
