package com.junglegym.recovery;

import com.junglegym.common.BusinessException;
import com.junglegym.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.junglegym.auth.JwtTokenService;
import com.junglegym.common.RateLimitService;
import java.time.Duration;

@Service
public class RecoveryService {
    private final EmailVerificationService verification;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenService tokens;
    private final RateLimitService rateLimit;

    public RecoveryService(EmailVerificationService verification, UserRepository users, PasswordEncoder encoder,
                           JwtTokenService tokens, RateLimitService rateLimit) {
        this.verification = verification; this.users = users; this.encoder = encoder; this.tokens = tokens;
        this.rateLimit = rateLimit;
    }
    public void sendCode(RecoveryDtos.SendCodeRequest request, String clientIp) {
        rateLimit.check("mail-ip", clientIp, 10, Duration.ofMinutes(1));
        verification.sendCode(request.email(), request.purpose());
    }

    public RecoveryDtos.VerifyCodeResponse verifyCode(RecoveryDtos.VerifyCodeRequest request) {
        return verification.verify(request.email(), request.code(), request.purpose());
    }

    @Transactional
    public void resetPassword(String ticket, String password) {
        String email = verification.consumeTicket(ticket, VerificationPurpose.RESET_PASSWORD);
        User user = users.findByEmail(email).orElseThrow(() -> new BusinessException(
                "USER_NOT_FOUND", "등록된 사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        user.changePassword(encoder.encode(password));
        tokens.revokeAll(user.getId());
    }
}
