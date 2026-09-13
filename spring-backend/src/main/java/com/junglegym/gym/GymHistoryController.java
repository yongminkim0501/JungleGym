package com.junglegym.gym;

import com.junglegym.auth.AuthenticatedUser;
import com.junglegym.common.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gym/visits")
public class GymHistoryController {
    private final GymHistoryService historyService;

    public GymHistoryController(GymHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    ApiResponse<GymDtos.HistoryResponse> history(@AuthenticationPrincipal AuthenticatedUser user,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(historyService.history(user.id(), page, size));
    }
}
