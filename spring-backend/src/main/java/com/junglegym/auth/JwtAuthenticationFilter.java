package com.junglegym.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenService tokens;
    private final AuthService authService;
    private final JwtCookieHandler cookies;

    public JwtAuthenticationFilter(JwtTokenService tokens, AuthService authService, JwtCookieHandler cookies) {
        this.tokens = tokens;
        this.authService = authService;
        this.cookies = cookies;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            var authentication = tokens.authenticate(cookies.accessToken(request), cookies.refreshToken(request));
            if (authentication != null) {
                if (authentication.refreshedTokens() != null) {
                    cookies.write(response, authentication.refreshedTokens());
                }
                authService.findPrincipal(authentication.userId()).ifPresent(user ->
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user, null, List.of())));
            }
        }
        chain.doFilter(request, response);
    }
}
