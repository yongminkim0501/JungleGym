package com.junglegym.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.junglegym.common.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter,
            ObjectMapper objectMapper
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/csrf", "/api/recovery/**", "/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(errors -> errors
                  .authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(), ApiError.of("UNAUTHORIZED", "로그인이 필요합니다."));
                  })
                  .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(), ApiError.of("FORBIDDEN", "요청 권한 또는 CSRF 토큰을 확인해주세요."));
                  }))
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.frontend-origin}") String frontendOrigin) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN", "X-ADMIN-CSRF"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
