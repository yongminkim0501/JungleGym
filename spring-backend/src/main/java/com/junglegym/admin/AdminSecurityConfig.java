package com.junglegym.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.junglegym.common.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Configuration
public class AdminSecurityConfig {
    @Bean @Order(1)
    SecurityFilterChain adminChain(HttpSecurity http, AdminSessionService sessions, ObjectMapper mapper) throws Exception {
        var csrf = new CookieCsrfTokenRepository();
        csrf.setCookieName("ADMIN-XSRF-TOKEN");
        csrf.setHeaderName("X-ADMIN-CSRF");
        csrf.setCookiePath("/");
        return http.securityMatcher("/api/admin/**")
                .csrf(config -> config.csrfTokenRepository(csrf))
                .cors(config -> {})
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(config -> config
                        .requestMatchers("/api/admin/auth/login", "/api/admin/auth/csrf", "/api/admin/auth/logout").permitAll()
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                            throws IOException, ServletException {
                        var principal = sessions.authenticate(request);
                        if (principal != null) SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
                        chain.doFilter(request, response);
                    }
                }, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(config -> config
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401); response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            mapper.writeValue(response.getOutputStream(), ApiError.of("ADMIN_UNAUTHORIZED", "관리자 로그인이 필요합니다."));
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403); response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            mapper.writeValue(response.getOutputStream(), ApiError.of("ADMIN_FORBIDDEN", "관리자 권한 또는 CSRF 토큰을 확인해주세요."));
                        })).build();
    }
}
