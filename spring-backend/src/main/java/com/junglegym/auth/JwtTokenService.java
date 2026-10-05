package com.junglegym.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtTokenService {
    private static final Duration ACCESS_TTL = Duration.ofMinutes(15);
    private static final Duration REFRESH_TTL = Duration.ofDays(30);
    private final SecretKey key;
    private final TokenRepository tokens;
    private final com.junglegym.user.UserRepository users;

    public JwtTokenService(TokenRepository tokens, com.junglegym.user.UserRepository users, @Value("${app.jwt-secret}") String secret) {
        this.users = users;
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalArgumentException("app.jwt-secret must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.tokens = tokens;
    }

    public TokenPair issue(Long userId) {
        String refreshId = UUID.randomUUID().toString();
        String access = create(userId, "access", ACCESS_TTL, UUID.randomUUID().toString());
        String refresh = create(userId, "refresh", REFRESH_TTL, refreshId);
        tokens.saveRefresh(refreshId, userId, REFRESH_TTL);
        return new TokenPair(access, refresh, ACCESS_TTL, REFRESH_TTL);
    }

    public TokenAuthentication authenticate(String access, String refresh) {
        try {
            Claims claims = parse(access, "access");
            if (tokens.isAccessDenied(claims.getId())) {
                return null;
            }
            if (!isCurrentUser(claims)) return null;
            return claims.getSubject() == null ? null
                    : new TokenAuthentication(Long.valueOf(claims.getSubject()), null);
        } catch (RuntimeException ignored) {
            // Preserve the refresh fallback used by the existing authentication flow.
        }
        if (refresh == null) {
            return null;
        }
        try {
            Claims claims = parse(refresh, "refresh");
            if (!isCurrentUser(claims)) return null;
            String userId = tokens.consumeRefresh(claims.getId());
            if (userId == null) {
                return null;
            }
            Long id = Long.valueOf(userId);
            return new TokenAuthentication(id, issue(id));
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    public void revoke(String access, String refresh) {
        if (access != null) {
            try {
                Claims claims = parse(access, "access");
                long remaining = claims.getExpiration().getTime() - System.currentTimeMillis();
                if (remaining > 0) {
                    tokens.denyAccess(claims.getId(), Duration.ofMillis(remaining));
                }
            } catch (RuntimeException ignored) {
                // A malformed or expired cookie must not prevent clearing the other cookie.
            }
        }
        if (refresh != null) {
            try {
                tokens.deleteRefresh(parse(refresh, "refresh").getId());
            } catch (RuntimeException ignored) {
                // Preserve logout behavior for invalid refresh cookies.
            }
        }
    }

    public void revokeAll(Long userId) {
        tokens.deleteAllRefresh(userId);
    }

    private String create(Long userId, String type, Duration ttl, String id) {
        var user = users.findById(userId).orElseThrow();
        if (user.isSuspended()) throw new IllegalStateException("Account suspended");
        return Jwts.builder().subject(userId.toString()).claim("type", type).claim("sv", user.getSecurityVersion()).id(id)
                .issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + ttl.toMillis()))
                .signWith(key).compact();
    }

    private Claims parse(String token, String type) {
        if (token == null) {
            throw new JwtException("missing token");
        }
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        if (!type.equals(claims.get("type", String.class))) {
            throw new JwtException("invalid token type");
        }
        return claims;
    }

    private boolean isCurrentUser(Claims claims) {
        Number version = claims.get("sv", Number.class);
        long issuedVersion = version == null ? 0 : version.longValue();
        return users.findById(Long.valueOf(claims.getSubject()))
                .filter(user -> !user.isSuspended() && user.getSecurityVersion() == issuedVersion).isPresent();
    }

    public record TokenAuthentication(Long userId, TokenPair refreshedTokens) {}
}
