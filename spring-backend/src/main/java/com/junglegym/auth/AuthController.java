package com.junglegym.auth;

import com.junglegym.common.ApiResponse;
import com.junglegym.common.ClientAddressResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtCookieHandler cookies;

    public AuthController(AuthService authService, JwtCookieHandler cookies) {
        this.authService = authService;
        this.cookies = cookies;
    }

    @PostMapping("/register")
    ResponseEntity<ApiResponse<AuthDtos.UserResponse>> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authService.register(request)));
    }

    @PostMapping("/login")
    ApiResponse<AuthDtos.UserResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request,
                                            HttpServletRequest servletRequest, HttpServletResponse response) {
        var result = authService.login(request, ClientAddressResolver.resolve(servletRequest));
        cookies.write(response, result.tokens());
        return ApiResponse.ok(result.user());
    }

    @GetMapping("/csrf")
    ApiResponse<String> csrf(CsrfToken token) {
        return ApiResponse.ok(token.getToken());
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(cookies.accessToken(request), cookies.refreshToken(request));
        cookies.clear(response);
        return ApiResponse.ok();
    }

    @GetMapping("/me")
    ApiResponse<AuthDtos.UserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(AuthDtos.UserResponse.from(user));
    }
}
