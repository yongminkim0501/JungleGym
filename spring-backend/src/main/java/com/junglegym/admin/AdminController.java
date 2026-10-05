package com.junglegym.admin;

import com.junglegym.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final AdminSessionService sessions;
    private final AdminService admin;
    private final SystemMetricsService metrics;
    public AdminController(AdminSessionService sessions, AdminService admin, SystemMetricsService metrics) {
        this.sessions = sessions; this.admin = admin; this.metrics = metrics;
    }
    @GetMapping("/auth/csrf") ApiResponse<String> csrf(CsrfToken token) { return ApiResponse.ok(token.getToken()); }
    @PostMapping("/auth/login") ApiResponse<AdminSessionService.Principal> login(@Valid @RequestBody AdminDtos.Login input,
            HttpServletRequest request, HttpServletResponse response) {
        return ApiResponse.ok(sessions.login(input.token(), request, response));
    }
    @GetMapping("/auth/me") ApiResponse<AdminSessionService.Principal> me(@AuthenticationPrincipal AdminSessionService.Principal principal) {
        return ApiResponse.ok(principal);
    }
    @PostMapping("/auth/logout") ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.logout(request, response); return ApiResponse.ok();
    }
    @GetMapping("/data") ApiResponse<AdminDtos.Data> data() { return ApiResponse.ok(admin.data()); }
    @GetMapping("/metrics") ApiResponse<AdminDtos.Metrics> metrics() { return ApiResponse.ok(metrics.current()); }
    @PatchMapping("/users/{id}") ApiResponse<AdminDtos.Member> update(@PathVariable Long id,
            @Valid @RequestBody AdminDtos.UpdateMember input, @AuthenticationPrincipal AdminSessionService.Principal principal) {
        return ApiResponse.ok(admin.update(id, input, principal));
    }
}
