package com.junglegym.auth;

import com.junglegym.common.BusinessException;
import com.junglegym.common.RateLimitService;
import java.time.Duration;
import java.util.Optional;
import com.junglegym.user.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    private final JwtTokenService tokens;
    private final RateLimitService rateLimit;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       JwtTokenService tokens, RateLimitService rateLimit) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.rateLimit = rateLimit;
    }

    @Transactional
    public AuthDtos.UserResponse register(AuthDtos.RegisterRequest request) {
        if (users.existsByJungleNumber(request.jungleNumber()))
            throw new BusinessException("JUNGLE_NUMBER_ALREADY_EXISTS", "이미 가입된 정글 사용자 번호입니다.", HttpStatus.CONFLICT);
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email))
            throw new BusinessException("EMAIL_ALREADY_EXISTS", "이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT);
        if (users.existsByNickname(request.nickname().trim()))
            throw new BusinessException("NICKNAME_ALREADY_EXISTS", "이미 사용 중인 닉네임입니다.", HttpStatus.CONFLICT);
        return AuthDtos.UserResponse.from(users.save(new User(email, request.jungleNumber(), request.nickname(), request.name(), passwordEncoder.encode(request.password()))));
    }

    @Transactional(readOnly = true)
    public LoginResult login(AuthDtos.LoginRequest request, String clientIp) {
        rateLimit.check("login-ip", clientIp, 30, Duration.ofMinutes(10));
        rateLimit.check("login-account", normalizeEmail(request.email()), 10, Duration.ofMinutes(10));
        User user = users.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> invalidCredentials());
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) throw invalidCredentials();
        if (user.isSuspended()) throw new BusinessException("USER_SUSPENDED", "이용이 정지된 계정입니다.", HttpStatus.FORBIDDEN);
        return new LoginResult(AuthDtos.UserResponse.from(user), tokens.issue(user.getId()));
    }

    public void logout(String accessToken, String refreshToken) {
        tokens.revoke(accessToken, refreshToken);
    }

    @Transactional(readOnly = true)
    public Optional<AuthenticatedUser> findPrincipal(Long userId) {
        return users.findById(userId).filter(user -> !user.isSuspended()).map(AuthenticatedUser::from);
    }

    public record LoginResult(AuthDtos.UserResponse user, TokenPair tokens) {}

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(); }
    private static BusinessException invalidCredentials() {
        return new BusinessException("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED);
    }
}
