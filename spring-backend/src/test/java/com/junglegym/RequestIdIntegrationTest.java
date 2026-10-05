package com.junglegym;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.junglegym.common.RequestIdFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
@Import(RequestIdIntegrationTest.FailingController.class)
class RequestIdIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @TestConfiguration @RestController
    static class FailingController {
        @GetMapping("/api/test/failure") String fail() { throw new IllegalStateException("database exploded"); }
    }

    @Test void issuesRequestIdAndKeepsValidProxyIds() throws Exception {
        String issued = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk())
                .andReturn().getResponse().getHeader(RequestIdFilter.HEADER);
        assertNotNull(issued);
        assertTrue(issued.matches("[0-9a-f-]{36}"));

        mvc.perform(get("/api/auth/csrf").header(RequestIdFilter.HEADER, "proxy-1234-abcd"))
                .andExpect(header().string(RequestIdFilter.HEADER, "proxy-1234-abcd"));
        String forged = mvc.perform(get("/api/auth/csrf").header(RequestIdFilter.HEADER, "x\nERROR fake log line"))
                .andReturn().getResponse().getHeader(RequestIdFilter.HEADER);
        assertNotEquals("x\nERROR fake log line", forged);
        assertTrue(forged.matches("[0-9a-f-]{36}"));
    }

    @Test void errorBodiesCarryTheSameRequestId() throws Exception {
        var response = mvc.perform(get("/api/admin/data")).andExpect(status().isUnauthorized()).andReturn().getResponse();
        assertEquals(response.getHeader(RequestIdFilter.HEADER),
                json.readTree(response.getContentAsString()).get("requestId").asText());
    }

    @Test void unexpectedErrorsAreLoggedWithCauseAndRequestId(CapturedOutput output) throws Exception {
        var response = mvc.perform(get("/api/test/failure").with(user("member")).header(RequestIdFilter.HEADER, "trace-500-check"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.requestId").value("trace-500-check"))
                .andReturn().getResponse();
        assertFalse(response.getContentAsString().contains("database exploded"), "Internal details must not reach the client");
        assertTrue(output.getOut().contains("[trace-500-check]"));
        assertTrue(output.getOut().contains("Unhandled exception"));
        assertTrue(output.getOut().contains("java.lang.IllegalStateException: database exploded"));
        assertTrue(output.getOut().contains("GET /api/test/failure -> 500"));
    }
}
