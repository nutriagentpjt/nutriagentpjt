package com.NurtiAgent.Onboard.preference.controller;

import com.NurtiAgent.Onboard.common.annotation.GuestId;
import com.NurtiAgent.Onboard.preference.dto.AddFoodRequest;
import com.NurtiAgent.Onboard.preference.dto.PreferenceResponse;
import com.NurtiAgent.Onboard.preference.dto.PreferenceUpdateRequest;
import com.NurtiAgent.Onboard.preference.dto.RemoveFoodRequest;
import com.NurtiAgent.Onboard.preference.service.PreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @PostMapping("/foods")
    public ResponseEntity<PreferenceResponse> addFood(
            @GuestId String guestId,
            @Valid @RequestBody AddFoodRequest request) {
        PreferenceResponse response = preferenceService.addFood(guestId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/foods")
    public ResponseEntity<PreferenceResponse> removeFood(
            @GuestId String guestId,
            @Valid @RequestBody RemoveFoodRequest request) {
        PreferenceResponse response = preferenceService.removeFood(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<PreferenceResponse> getPreferences(@GuestId String guestId) {
        PreferenceResponse response = preferenceService.getPreferences(guestId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<PreferenceResponse> updatePreferences(
            @GuestId String guestId,
            @Valid @RequestBody PreferenceUpdateRequest request) {
        PreferenceResponse response = preferenceService.updatePreferences(guestId, request);
        return ResponseEntity.ok(response);
    }
}
