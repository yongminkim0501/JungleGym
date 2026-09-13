package com.junglegym.recovery;

import jakarta.validation.constraints.*;

public final class RecoveryDtos {
    private RecoveryDtos() {}
    public record SendCodeRequest(@Email @NotBlank String email, @NotNull VerificationPurpose purpose) {}
    public record VerifyCodeRequest(@Email @NotBlank String email, @Pattern(regexp = "\\d{6}") String code,
                                    @NotNull VerificationPurpose purpose) {}
    public record VerifyCodeResponse(String ticket, String email, String name) {}
    public record ResetPasswordRequest(@NotBlank String ticket, @Size(min = 8, max = 72) String password) {}
}
