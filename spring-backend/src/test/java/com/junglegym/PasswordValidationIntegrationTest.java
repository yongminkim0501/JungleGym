package com.junglegym;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PasswordValidationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired StringRedisTemplate redis;

    @Test
    void rejectsPasswordsOver72BytesOnRegisterLoginAndReset() throws Exception {
        for (String password : new String[]{"가".repeat(25), "😀".repeat(19), "a".repeat(73)}) {
            for (String path : new String[]{"/api/auth/register", "/api/auth/login", "/api/recovery/reset-password"}) {
                mvc.perform(post(path).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(payload(password))))
                        .andExpect(status().isBadRequest())
                        .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                        .andExpect(jsonPath("$.fieldErrors.password").exists());
            }
        }
        for (String path : new String[]{"/api/auth/register", "/api/recovery/reset-password"}) {
            var body = new HashMap<>(payload("unused"));
            body.remove("password");
            mvc.perform(post(path).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
        }
    }

    @Test
    void accepts72BytePasswordsAndPreservesResetTicketAfterInvalidInput() throws Exception {
        String email = "password-boundary@example.com";
        var registration = new HashMap<>(payload("가".repeat(24)));
        registration.put("email", email);
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(registration)))
                .andExpect(status().isCreated());
        login(email, "가".repeat(24));

        String ticket = "password-byte-boundary-ticket";
        String key = "email-verification:ticket:RESET_PASSWORD:" + ticket;
        redis.opsForValue().set(key, email, Duration.ofMinutes(1));
        mvc.perform(post("/api/recovery/reset-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("ticket", ticket, "password", "가".repeat(25)))))
                .andExpect(status().isBadRequest());
        assertEquals(email, redis.opsForValue().get(key));
        mvc.perform(post("/api/recovery/reset-password").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("ticket", ticket, "password", "a".repeat(72)))))
                .andExpect(status().isOk());
        login(email, "a".repeat(72));
    }

    private void login(String email, String password) throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk());
    }

    private Map<String, String> payload(String password) {
        return Map.of("email", "password-validation@example.com", "jungleNumber", "password-validation",
                "nickname", "password-validation", "name", "검사", "password", password, "ticket", "unused-ticket");
    }
}
