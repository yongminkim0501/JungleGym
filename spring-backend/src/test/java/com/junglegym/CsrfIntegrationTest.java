package com.junglegym;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
// csrf() test postprocessors install a test repository in the cached filter chain.
// Use a fresh context to exercise the production CookieCsrfTokenRepository.
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class CsrfIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void realCsrfLoginRefreshAndLogoutContractIsPreserved() throws Exception {
        MvcResult csrfResponse = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk()).andReturn();
        Cookie csrfCookie = csrfResponse.getResponse().getCookie("XSRF-TOKEN");
        String maskedToken = objectMapper.readTree(csrfResponse.getResponse().getContentAsString())
                .path("data").asText();
        org.junit.jupiter.api.Assertions.assertNotEquals(csrfCookie.getValue(), maskedToken);

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"contract@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").cookie(csrfCookie).header("X-XSRF-TOKEN", "wrong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"contract@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/register").cookie(csrfCookie).header("X-XSRF-TOKEN", maskedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"contract@example.com","jungleNumber":"csrf-contract",
                                 "nickname":"contract","name":"계약 검증","password":"password123"}
                                """))
                .andExpect(status().isCreated());
        MvcResult login = mvc.perform(post("/api/auth/login").cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", maskedToken).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"contract@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andReturn();
        Cookie access = login.getResponse().getCookie("access_token");
        Cookie refresh = login.getResponse().getCookie("refresh_token");
        org.junit.jupiter.api.Assertions.assertTrue(access.isHttpOnly());
        org.junit.jupiter.api.Assertions.assertTrue(refresh.isHttpOnly());
        org.junit.jupiter.api.Assertions.assertEquals("/", access.getPath());
        org.junit.jupiter.api.Assertions.assertEquals(900, access.getMaxAge());
        org.junit.jupiter.api.Assertions.assertEquals(2592000, refresh.getMaxAge());
        org.junit.jupiter.api.Assertions.assertTrue(login.getResponse().getHeaders("Set-Cookie").stream()
                .allMatch(cookie -> cookie.contains("SameSite=Lax")));
        mvc.perform(get("/api/dashboard").cookie(access, refresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.nickname").value("contract"))
                .andExpect(jsonPath("$.data.attendanceDays").isArray())
                .andExpect(jsonPath("$.data.monthlyAttendance").value(0))
                .andExpect(jsonPath("$.data.streakDays").value(0));
        mvc.perform(get("/api/gym/visits?page=-1&size=1000").cookie(access, refresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(0));

        // Missing access token exercises the same renewal path as an expired one.
        MvcResult renewal = mvc.perform(get("/api/auth/me").cookie(refresh))
                .andExpect(status().isOk()).andReturn();
        Cookie renewedAccess = renewal.getResponse().getCookie("access_token");
        Cookie renewedRefresh = renewal.getResponse().getCookie("refresh_token");
        org.junit.jupiter.api.Assertions.assertNotEquals(refresh.getValue(), renewedRefresh.getValue());
        mvc.perform(get("/api/auth/me").cookie(refresh)).andExpect(status().isUnauthorized());

        MvcResult logout = mvc.perform(post("/api/auth/logout").cookie(csrfCookie, renewedAccess, renewedRefresh)
                        .header("X-XSRF-TOKEN", maskedToken))
                .andExpect(status().isOk()).andReturn();
        org.junit.jupiter.api.Assertions.assertEquals(0, logout.getResponse().getCookie("access_token").getMaxAge());
        org.junit.jupiter.api.Assertions.assertEquals(0, logout.getResponse().getCookie("refresh_token").getMaxAge());
        mvc.perform(get("/api/auth/me").cookie(renewedAccess, renewedRefresh))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").cookie(renewedRefresh)).andExpect(status().isUnauthorized());
    }
}
