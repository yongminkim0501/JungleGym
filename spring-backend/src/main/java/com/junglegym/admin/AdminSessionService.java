package com.junglegym.admin;

import com.junglegym.common.BusinessException;
import com.junglegym.common.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AdminSessionService {
    public static final String COOKIE = "junglegym-admin-session";
    private static final Duration TTL = Duration.ofHours(8);
    private final StringRedisTemplate redis;
    private final RateLimitService rateLimit;
    private final String first;
    private final String second;
    private final boolean secure;
    private final SecureRandom random = new SecureRandom();

    public record Principal(int id, String name) {}

    public AdminSessionService(StringRedisTemplate redis, RateLimitService rateLimit,
            @Value("${app.admin.token-1:}") String first,
            @Value("${app.admin.token-2:}") String second,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
        this.redis = redis; this.rateLimit = rateLimit;
        this.first = first.trim(); this.second = second.trim(); this.secure = secure;
    }

    private boolean configured() {
        return first.length() >= 32 && first.length() <= 256 && second.length() >= 32
                && second.length() <= 256 && !first.equals(second);
    }

    private static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private static boolean matches(String left, String right) {
        return MessageDigest.isEqual(hash(left).getBytes(StandardCharsets.US_ASCII),
                hash(right).getBytes(StandardCharsets.US_ASCII));
    }

    public Principal login(String token, HttpServletRequest request, HttpServletResponse response) {
        if (!configured()) throw new BusinessException("ADMIN_NOT_CONFIGURED", "관리자 토큰 설정이 필요합니다.", HttpStatus.SERVICE_UNAVAILABLE);
        // A shared Redis bucket also covers attempts routed to different instances.
        rateLimit.check("admin-login", "global", 10, Duration.ofMinutes(1));
        boolean matchFirst = matches(first, token.trim());
        boolean matchSecond = matches(second, token.trim());
        int id = matchFirst ? 1 : matchSecond ? 2 : 0;
        if (id == 0) throw new BusinessException("INVALID_ADMIN_TOKEN", "토큰을 확인해 주세요.", HttpStatus.UNAUTHORIZED);
        revoke(request);
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String session = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        redis.opsForValue().set("admin:session:" + hash(session), id + ":" + hash(id == 1 ? first : second), TTL);
        cookie(response, session, TTL);
        return new Principal(id, "관리자 " + id);
    }

    public Principal authenticate(HttpServletRequest request) {
        if (!configured()) return null;
        String cookie = readCookie(request);
        if (cookie == null || !cookie.matches("[A-Za-z0-9_-]{43}")) return null;
        String key = "admin:session:" + hash(cookie);
        String value = redis.opsForValue().get(key);
        if (value == null) return null;
        for (int id = 1; id <= 2; id++) {
            if (value.equals(id + ":" + hash(id == 1 ? first : second)))
                return new Principal(id, "관리자 " + id);
        }
        redis.delete(key);
        return null;
    }

    private String readCookie(HttpServletRequest request) {
        if (request.getCookies() != null) for (var cookie : request.getCookies())
            if (COOKIE.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
    private void revoke(HttpServletRequest request) {
        String cookie = readCookie(request);
        if (cookie != null) redis.delete("admin:session:" + hash(cookie));
    }
    private void cookie(HttpServletResponse response, String value, Duration age) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(COOKIE, value)
                .httpOnly(true).secure(secure).sameSite("Strict").path("/").maxAge(age).build().toString());
    }
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        revoke(request); cookie(response, "", Duration.ZERO);
    }
}
