package com.junglegym.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;

@Component
public class JwtCookieHandler {
    public static final String ACCESS_COOKIE = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";
    private final boolean secure;

    public JwtCookieHandler(@Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
        this.secure = secure;
    }

    public String accessToken(HttpServletRequest request) {
        return cookie(request, ACCESS_COOKIE);
    }

    public String refreshToken(HttpServletRequest request) {
        return cookie(request, REFRESH_COOKIE);
    }

    public void write(HttpServletResponse response, TokenPair tokens) {
        setCookie(response, ACCESS_COOKIE, tokens.accessToken(), tokens.accessTtl());
        setCookie(response, REFRESH_COOKIE, tokens.refreshToken(), tokens.refreshTtl());
    }

    public void clear(HttpServletResponse response) {
        setCookie(response, ACCESS_COOKIE, "", Duration.ZERO);
        setCookie(response, REFRESH_COOKIE, "", Duration.ZERO);
    }

    private String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void setCookie(HttpServletResponse response, String name, String value, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value)
                .path("/").httpOnly(true).sameSite("Lax").secure(secure).maxAge(maxAge).build().toString());
    }
}
