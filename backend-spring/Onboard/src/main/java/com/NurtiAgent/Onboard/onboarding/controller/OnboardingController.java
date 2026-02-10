package com.NurtiAgent.Onboard.onboarding.controller;

import com.NurtiAgent.Onboard.onboarding.dto.OnboardingRequest;
import com.NurtiAgent.Onboard.onboarding.dto.OnboardingResponse;
import com.NurtiAgent.Onboard.onboarding.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "온보딩(Onboarding)", description = "온보딩 정보 관련 API입니다.")
@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @Operation(summary = "온보딩 정보 저장", description = "사용자의 온보딩 정보를 저장합니다. 기존 정보가 있으면 업데이트됩니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 정보 저장 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (세션 없음)")
    })
    @PostMapping
    public ResponseEntity<OnboardingResponse> saveOnboardingInfo(
            HttpServletRequest request,
            @Valid @RequestBody OnboardingRequest onboardingRequest) {
        OnboardingResponse response = onboardingService.saveOnboardingInfo(request, onboardingRequest);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "온보딩 정보 조회", description = "현재 로그인한 사용자의 온보딩 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 정보 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (세션 없음)"),
            @ApiResponse(responseCode = "404", description = "온보딩 정보가 존재하지 않음")
    })
    @GetMapping
    public ResponseEntity<OnboardingResponse> getOnboardingInfo(HttpServletRequest request) {
        OnboardingResponse response = onboardingService.getOnboardingInfo(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "온보딩 정보 삭제", description = "현재 로그인한 사용자의 온보딩 정보를 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "온보딩 정보 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (세션 없음)"),
            @ApiResponse(responseCode = "404", description = "온보딩 정보가 존재하지 않음")
    })
    @DeleteMapping
    public ResponseEntity<String> deleteOnboardingInfo(HttpServletRequest request) {
        onboardingService.deleteOnboardingInfo(request);
        return ResponseEntity.ok("온보딩 정보가 삭제되었습니다.");
    }
}
