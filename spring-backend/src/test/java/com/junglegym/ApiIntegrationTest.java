package com.junglegym;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import jakarta.servlet.http.Cookie;
import java.time.Duration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired StringRedisTemplate redis;
    @Autowired com.junglegym.user.UserRepository users;

    @Test
    void registerLoginAndGymVisitFlow() throws Exception {
        String registerBody = """
                {"email":"jungle@example.com","jungleNumber":"00123","nickname":"jungle","name":"정글러","password":"password123"}
                """;
        mvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        String loginBody = """
                {"email":"jungle@example.com","password":"password123"}
                """;
        MvcResult login = mvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("jungle"))
                .andReturn();

        Cookie accessCookie = login.getResponse().getCookie("access_token");
        Cookie refreshCookie = login.getResponse().getCookie("refresh_token");
        MvcResult checkIn = mvc.perform(post("/api/gym/check-in").with(csrf()).cookie(accessCookie, refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        mvc.perform(get("/api/dashboard").cookie(accessCookie, refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(true))
                .andExpect(jsonPath("$.data.monthlyAttendance").value(1))
                .andExpect(jsonPath("$.data.weeklyVisits.length()").value(7))
                .andExpect(jsonPath("$.data.workoutCount").value(0));

        mvc.perform(post("/api/gym/check-out")
                        .with(csrf())
                        .cookie(accessCookie, refreshCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"#오운완\",\"image\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("#오운완"));

        mvc.perform(get("/api/gym/visits").cookie(accessCookie, refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("#오운완"));

        String resetTicket = "integration-reset-ticket";
        redis.opsForValue().set("email-verification:ticket:RESET_PASSWORD:" + resetTicket,
                "jungle@example.com", Duration.ofMinutes(1));
        mvc.perform(post("/api/recovery/reset-password").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticket\":\"" + resetTicket + "\",\"password\":\"newPassword123\"}"))
                .andExpect(status().isOk());

        // Access JWTs are intentionally short-lived and remain valid until expiry.
        // Password reset revokes the Redis-backed refresh token, preventing renewal.
        mvc.perform(get("/api/auth/me").cookie(accessCookie, refreshCookie))
                .andExpect(status().isOk());
    }

    @Test
    void jungleNumberIsRequiredAndDuplicateRegistrationIsRejected() throws Exception {
        for (String number : new String[]{"null", "\"\"", "\"   \"", "\"" + "1".repeat(51) + "\""}) {
            mvc.perform(post("/api/auth/register").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"number@example.com\",\"nickname\":\"number-test\","
                                    + "\"name\":\"정글러\",\"password\":\"password123\",\"jungleNumber\":" + number + "}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.jungleNumber").exists());
        }
        mvc.perform(post("/api/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"number@example.com","nickname":"number-test","name":"정글러",
                                 "password":"password123","jungleNumber":" 00999 "}
                                """))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"other@example.com","nickname":"other-test","name":"다른 사람",
                                 "password":"password123","jungleNumber":"00999"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("JUNGLE_NUMBER_ALREADY_EXISTS"));
        org.junit.jupiter.api.Assertions.assertEquals("00999",
                users.findByEmail("number@example.com").orElseThrow().getJungleNumber());
    }

    @Test
    void protectedApiReturnsJsonUnauthorized() throws Exception {
        mvc.perform(post("/api/gym/check-in").with(csrf()))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

}
