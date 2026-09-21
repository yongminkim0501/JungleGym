package com.junglegym;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.junglegym.auth.AuthenticatedUser;
import com.junglegym.gym.GymVisit;
import com.junglegym.gym.GymVisitRepository;
import com.junglegym.user.User;
import com.junglegym.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CalendarIntegrationTest {
    private static final String CALENDAR = "/api/dashboard/calendar";
    private static final String ATTENDANCE = CALENDAR + "/attendance";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired GymVisitRepository visits;
    private User user;

    @BeforeEach
    void createUser() {
        user = users.saveAndFlush(new User("calendar@example.com", "calendar-001", "calendar",
                "달력 사용자", "unused-test-hash"));
    }

    @ParameterizedTest
    @CsvSource({"2025, 2, 28", "2024, 2, 29", "2026, 9, 30", "2026, 12, 31", "2100, 2, 28"})
    void emptyMonthsContainEveryDayAndNoAttendance(int year, int month, int length) throws Exception {
        JsonNode days = read(CALENDAR, year, month);
        assertTrue(days.isArray());
        assertEquals(length, days.size());
        for (int index = 0; index < length; index++) {
            assertEquals(mapper.readTree("{\"date\":" + (index + 1)
                    + ",\"ischeck\":false,\"title\":\"\",\"img_url\":\"\"}"), days.get(index));
        }
        assertEquals(mapper.readTree("[]"), read(ATTENDANCE, year, month));
    }

    @Test
    void groupsVisitsWithoutMixingRecordsOrErasingWorkouts() throws Exception {
        visit(user, "2026-09-02T00:00:00Z", "오전 운동", "https://example.com/old.jpg", false);
        visit(user, "2026-09-02T01:00:00Z", "오후 운동", null, false);
        visit(user, "2026-09-02T02:00:00Z", "", null, false);
        // Equal check-in timestamps use the higher visit ID as the last record.
        visit(user, "2026-09-03T00:00:00Z", "이전 제목", null, false);
        visit(user, "2026-09-03T00:00:00Z", "", "https://example.com/new.jpg", false);
        visit(user, "2026-09-04T00:00:00Z", "", null, false);
        visit(user, "2026-09-05T00:00:00Z", "", null, true);

        JsonNode attended = read(ATTENDANCE, 2026, 9);
        assertEquals(mapper.readTree("""
                [
                  {"date":2,"title":"오후 운동","img_url":""},
                  {"date":3,"title":"","img_url":"https://example.com/new.jpg"},
                  {"date":4,"title":"","img_url":""},
                  {"date":5,"title":"","img_url":""}
                ]
                """), attended);
        JsonNode days = read(CALENDAR, 2026, 9);
        int attendanceIndex = 0;
        for (JsonNode day : days) {
            assertEquals(4, day.size());
            if (day.get("ischeck").asBoolean()) {
                JsonNode entry = attended.get(attendanceIndex++);
                assertEquals(day.get("date"), entry.get("date"));
                assertEquals(day.get("title"), entry.get("title"));
                assertEquals(day.get("img_url"), entry.get("img_url"));
            } else {
                assertEquals("", day.get("title").asText());
                assertEquals("", day.get("img_url").asText());
            }
        }
        assertEquals(attended.size(), attendanceIndex);
    }

    @Test
    void usesKoreanCheckInDatesAndExcludesOtherUsers() throws Exception {
        User other = users.saveAndFlush(new User("other-calendar@example.com", "calendar-002",
                "other-calendar", "다른 사용자", "unused-test-hash"));
        visit(other, "2026-09-10T00:00:00Z", "다른 사용자 기록", null, false);
        visit(user, "2026-08-31T14:59:59.999999Z", "이전 달", null, false);
        visit(user, "2026-08-31T15:00:00Z", "월 시작", null, false);
        visit(user, "2026-09-30T14:59:59.999999Z", "월 마지막", null, false);
        visit(user, "2026-09-30T15:00:00Z", "다음 달", null, false);
        assertEquals(mapper.readTree("""
                [{"date":1,"title":"월 시작","img_url":""},
                 {"date":30,"title":"월 마지막","img_url":""}]
                """), read(ATTENDANCE, 2026, 9));
        JsonNode days = read(CALENDAR, 2026, 9);
        assertTrue(days.get(0).get("ischeck").asBoolean());
        assertTrue(days.get(29).get("ischeck").asBoolean());
        assertFalse(days.get(9).get("ischeck").asBoolean());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "?year=2026", "?month=9", "?year=&month=9", "?year=abc&month=9",
            "?year=2026&month=abc", "?year=2026&month=1.5", "?year=2026&month=0",
            "?year=2026&month=13", "?year=0&month=9", "?year=-1&month=9",
            "?year=10000&month=9", "?year=999999999999999&month=9"})
    void rejectsInvalidParametersWithBadRequest(String query) throws Exception {
        for (String path : List.of(CALENDAR, ATTENDANCE)) {
            mvc.perform(get(path + query).with(asUser()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
    }

    @Test
    void requiresLoginForBothEndpoints() throws Exception {
        for (String path : List.of(CALENDAR, ATTENDANCE)) {
            mvc.perform(get(path).param("year", "2026").param("month", "9"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        }
    }

    private JsonNode read(String path, int year, int month) throws Exception {
        var response = mvc.perform(get(path).with(asUser())
                        .param("year", Integer.toString(year)).param("month", Integer.toString(month)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn().getResponse();
        return mapper.readTree(response.getContentAsByteArray());
    }

    private RequestPostProcessor asUser() {
        return authentication(new UsernamePasswordAuthenticationToken(AuthenticatedUser.from(user), null, List.of()));
    }

    private void visit(User owner, String checkedInAt, String title, String image, boolean active) {
        GymVisit visit = new GymVisit(owner);
        Instant checkIn = Instant.parse(checkedInAt);
        ReflectionTestUtils.setField(visit, "checkedInAt", checkIn);
        if (!active) {
            visit.checkOut(title, image);
            // Overnight visits still belong to their check-in date.
            ReflectionTestUtils.setField(visit, "checkedOutAt", checkIn.plusSeconds(7200));
        }
        visits.saveAndFlush(visit);
    }
}
