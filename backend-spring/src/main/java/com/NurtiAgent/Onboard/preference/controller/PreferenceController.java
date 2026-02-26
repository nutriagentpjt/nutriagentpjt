package com.NurtiAgent.Onboard.preference.controller;

import com.NurtiAgent.Onboard.preference.dto.AddFoodRequest;
import com.NurtiAgent.Onboard.preference.dto.PreferenceResponse;
import com.NurtiAgent.Onboard.preference.dto.RemoveFoodRequest;
import com.NurtiAgent.Onboard.preference.service.PreferenceService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @PostMapping("/foods")
    public ResponseEntity<PreferenceResponse> addFood(
            HttpSession session,
            @Valid @RequestBody AddFoodRequest request) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PreferenceResponse response = preferenceService.addFood(guestId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/foods")
    public ResponseEntity<PreferenceResponse> removeFood(
            HttpSession session,
            @Valid @RequestBody RemoveFoodRequest request) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PreferenceResponse response = preferenceService.removeFood(guestId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<PreferenceResponse> getPreferences(HttpSession session) {
        String guestId = (String) session.getAttribute("GUEST_ID");
        if (guestId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PreferenceResponse response = preferenceService.getPreferences(guestId);
        return ResponseEntity.ok(response);
    }
}
