package com.junglegym.gym;

import com.junglegym.common.ApiResponse;
import com.junglegym.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gym")
public class GymController {
    private final GymService gymService;

    public GymController(GymService gymService) { this.gymService = gymService; }

    @PostMapping("/check-in")
    ApiResponse<GymDtos.VisitResponse> checkIn(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(gymService.checkIn(user.id()));
    }

    @PostMapping("/check-out")
    ApiResponse<GymDtos.VisitResponse> checkOut(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody(required = false) GymDtos.CheckOutRequest request
    ) {
        GymDtos.CheckOutRequest body = request == null ? new GymDtos.CheckOutRequest("", "") : request;
        return ApiResponse.ok(gymService.checkOut(user.id(), body));
    }

}
