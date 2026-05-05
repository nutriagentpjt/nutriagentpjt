package com.NurtiAgent.Onboard.user.controller;

import com.NurtiAgent.Onboard.user.dto.GuestIdData;
import com.NurtiAgent.Onboard.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/guest/session")
    public String issueGuestSession(HttpServletRequest request) {
        return userService.saveUser(request);
    }

    @PostMapping("/renew/session")
    public String renewSession(@RequestBody GuestIdData guestIdData, HttpServletRequest request) {
        userService.renewSession(request, guestIdData.guestId());
        return "renew session";
    }
}
