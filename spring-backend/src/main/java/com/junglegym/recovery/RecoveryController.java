package com.junglegym.recovery;

import com.junglegym.common.ApiResponse;
import com.junglegym.common.ClientAddressResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recovery")
public class RecoveryController {
    private final RecoveryService recovery;

    public RecoveryController(RecoveryService recovery) {
        this.recovery = recovery;
    }

    @PostMapping("/send-code")
    ApiResponse<Void> sendCode(@Valid @RequestBody RecoveryDtos.SendCodeRequest request,
                              HttpServletRequest servletRequest) {
        recovery.sendCode(request, ClientAddressResolver.resolve(servletRequest));
        return ApiResponse.ok();
    }

    @PostMapping("/verify-code")
    ApiResponse<RecoveryDtos.VerifyCodeResponse> verify(@Valid @RequestBody RecoveryDtos.VerifyCodeRequest request) {
        return ApiResponse.ok(recovery.verifyCode(request));
    }

    @PostMapping("/reset-password")
    ApiResponse<Void> resetPassword(@Valid @RequestBody RecoveryDtos.ResetPasswordRequest request) {
        recovery.resetPassword(request.ticket(), request.password());
        return ApiResponse.ok();
    }
}
