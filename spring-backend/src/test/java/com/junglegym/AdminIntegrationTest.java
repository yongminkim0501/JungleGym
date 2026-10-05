package com.junglegym;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.junglegym.admin.*;
import com.junglegym.auth.JwtTokenService;
import com.junglegym.gym.GymVisitRepository;
import com.junglegym.user.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest(properties = {
    "app.admin.token-1=first-admin-test-token-with-at-least-32-characters",
    "app.admin.token-2=second-admin-test-token-with-at-least-32-characters"
})
@AutoConfigureMockMvc
class AdminIntegrationTest {
    private static final String FIRST = "first-admin-test-token-with-at-least-32-characters";
    private static final String SECOND = "second-admin-test-token-with-at-least-32-characters";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired GymVisitRepository visits;
    @Autowired AdminAuditRepository audit;
    @Autowired JwtTokenService tokens;
    @Autowired StringRedisTemplate redis;
    @Autowired PasswordEncoder passwords;
    @Autowired SystemMetricsService metrics;
    private User member;

    @BeforeEach void setup() {
        audit.deleteAll(); visits.deleteAll(); users.deleteAll();
        var keys = redis.keys("*"); if (keys != null && !keys.isEmpty()) redis.delete(keys);
        member = users.saveAndFlush(new User("member@example.com", "test-001", "member", "회원", passwords.encode("password123")));
    }

    private MockHttpServletRequestBuilder adminRequest(MockHttpServletRequestBuilder request) throws Exception {
        var csrfResponse = mvc.perform(get("/api/admin/auth/csrf")).andExpect(status().isOk()).andReturn();
        return request.cookie(csrfResponse.getResponse().getCookie("ADMIN-XSRF-TOKEN"))
                .header("X-ADMIN-CSRF", json.readTree(csrfResponse.getResponse().getContentAsString()).get("data").asText());
    }

    private Cookie login(String token, int id) throws Exception {
        var result = mvc.perform(adminRequest(post("/api/admin/auth/login"))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("token", token))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id)).andReturn();
        Cookie cookie = result.getResponse().getCookie(AdminSessionService.COOKIE);
        assertNotNull(cookie); assertTrue(cookie.isHttpOnly()); assertEquals(28800, cookie.getMaxAge());
        assertNotEquals(token, cookie.getValue());
        return cookie;
    }

    private String updateBody(String status, String note, long revision) throws Exception {
        return json.writeValueAsString(Map.of("name", "변경된 회원", "nickname", "member",
                "email", "member@example.com", "status", status, "note", note, "revision", revision));
    }

    @Test void requiresAdminSessionAndCsrf() throws Exception {
        mvc.perform(get("/api/admin/data")).andExpect(status().isUnauthorized());
        var userTokens = tokens.issue(member.getId());
        mvc.perform(get("/api/admin/data").cookie(new Cookie("access_token", userTokens.accessToken())))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token", FIRST)))).andExpect(status().isForbidden());
        mvc.perform(adminRequest(post("/api/admin/auth/login")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"incorrect\"}")).andExpect(status().isUnauthorized());
        Cookie admin = login(FIRST, 1);
        mvc.perform(get("/api/auth/me").cookie(admin)).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/admin/users/" + member.getId()).cookie(admin).contentType(MediaType.APPLICATION_JSON)
                .content(updateBody("active", "메모", 0))).andExpect(status().isForbidden());
    }

    @Test void twoAdminsShareDatabaseAndRecordActorRejectingStaleEdits() throws Exception {
        Cookie first = login(FIRST, 1); Cookie second = login(SECOND, 2);
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(first)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("active", "첫 관리자 메모", 0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.revision").value(1));
        var result = mvc.perform(get("/api/admin/data").cookie(second)).andExpect(status().isOk()).andReturn();
        String body = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(body.contains("첫 관리자 메모")); assertTrue(body.contains("관리자 1"));
        assertFalse(body.contains("passwordHash")); assertFalse(body.contains(FIRST));
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(second)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("active", "오래된 내용", 0)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("STALE_MEMBER"));
        assertEquals(1, audit.count());
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(second)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("suspended", "운영 규칙 위반", 1)))
                .andExpect(status().isOk());
        assertEquals(2, audit.count());
        assertTrue(audit.findAll().stream().anyMatch(event -> event.getAdminId() == 2 && event.getEventType().equals("suspend")));
    }

    @Test void suspensionInvalidatesBothTokensEvenAfterRestoringUser() throws Exception {
        Cookie admin = login(FIRST, 1);
        var original = tokens.issue(member.getId());
        Cookie access = new Cookie("access_token", original.accessToken());
        Cookie refresh = new Cookie("refresh_token", original.refreshToken());
        mvc.perform(get("/api/auth/me").cookie(access)).andExpect(status().isOk());
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("suspended", "", 0)))
                .andExpect(status().isBadRequest());
        assertEquals(0, audit.count());
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("suspended", "정지 사유", 0)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(access, refresh)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").cookie(refresh)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"member@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("active", "해제 사유", 1)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(access, refresh)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"member@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk());
    }

    @Test void logoutRevokesSessionAndMissingOrDuplicateTokensDisableAdminLogin() throws Exception {
        Cookie admin = login(FIRST, 1);
        mvc.perform(adminRequest(post("/api/admin/auth/logout")).cookie(admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/data").cookie(admin)).andExpect(status().isUnauthorized());
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        var response = new org.springframework.mock.web.MockHttpServletResponse();
        var limits = new com.junglegym.common.RateLimitService(redis);
        assertThrows(com.junglegym.common.BusinessException.class,
                () -> new AdminSessionService(redis, limits, "", "", false).login(FIRST, request, response));
        assertThrows(com.junglegym.common.BusinessException.class,
                () -> new AdminSessionService(redis, limits, FIRST, FIRST, false).login(FIRST, request, response));
    }

    @Test void expiredAndRotatedSessionsAreRejected() throws Exception {
        Cookie admin = login(FIRST, 1);
        var request = new org.springframework.mock.web.MockHttpServletRequest(); request.setCookies(admin);
        var service = new AdminSessionService(redis, new com.junglegym.common.RateLimitService(redis), FIRST, SECOND, false);
        assertNotNull(service.authenticate(request));
        var changed = new AdminSessionService(redis, new com.junglegym.common.RateLimitService(redis), FIRST + "changed", SECOND, false);
        assertNull(changed.authenticate(request));
        admin = login(SECOND, 2);
        for (String key : redis.keys("admin:session:*")) redis.expire(key, java.time.Duration.ZERO);
        mvc.perform(get("/api/admin/data").cookie(admin)).andExpect(status().isUnauthorized());
    }

    @Test void validationAndDatabaseUniquenessDoNotProduceAuditRecords() throws Exception {
        users.saveAndFlush(new User("taken@example.com", "test-002", "taken", "다른 회원", "unused"));
        Cookie admin = login(FIRST, 1);
        String body = updateBody("active", "검증", 0).replace("member@example.com", "taken@example.com");
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        mvc.perform(adminRequest(patch("/api/admin/users/" + member.getId())).cookie(admin)
                .contentType(MediaType.APPLICATION_JSON).content(updateBody("unexpected", "검증", 0)))
                .andExpect(status().isBadRequest());
        assertEquals(0, audit.count()); assertEquals("회원", users.findById(member.getId()).orElseThrow().getName());
    }

    @Test void loginAttemptsAreRateLimitedAcrossAdministrators() throws Exception {
        for (int i = 0; i < 10; i++) mvc.perform(adminRequest(post("/api/admin/auth/login"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"token\":\"incorrect\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(adminRequest(post("/api/admin/auth/login"))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("token", SECOND))))
                .andExpect(status().isTooManyRequests());
    }

    @Test void reportsRequestMetricsAndMinuteHistoryToAdminsOnly() throws Exception {
        mvc.perform(get("/api/admin/metrics")).andExpect(status().isUnauthorized());
        var userTokens = tokens.issue(member.getId());
        mvc.perform(get("/api/admin/metrics").cookie(new Cookie("access_token", userTokens.accessToken())))
                .andExpect(status().isUnauthorized());
        Cookie admin = login(FIRST, 1);
        metrics.sample();
        for (int i = 0; i < 3; i++) mvc.perform(get("/api/admin/data").cookie(admin)).andExpect(status().isOk());
        metrics.sample();
        var body = json.readTree(mvc.perform(get("/api/admin/metrics").cookie(admin))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("data");

        JsonNode data = null;
        for (var endpoint : body.get("endpoints"))
            if (endpoint.get("method").asText().equals("GET") && endpoint.get("uri").asText().equals("/api/admin/data")) data = endpoint;
        assertNotNull(data, "Admin data route should be reported by its route template");
        assertTrue(data.get("count").asLong() >= 3);
        assertTrue(data.get("meanMs").isNumber());
        assertTrue(data.get("p95Ms").isNumber());
        assertTrue(body.get("jvm").get("heapUsedMb").asLong() > 0);
        assertTrue(body.get("db").get("max").asInt() > 0);

        var history = body.get("history");
        assertEquals(2, history.size());
        assertTrue(history.get(1).get("requests").asLong() >= 3, "Second sample should hold only the requests since the first");
    }
}
