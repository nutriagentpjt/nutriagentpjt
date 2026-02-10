package com.NurtiAgent.Onboard.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게스트 아이디 정보")
public record GuestIdData(@Schema(description = "게스트 아이디") String guestId) {
}
