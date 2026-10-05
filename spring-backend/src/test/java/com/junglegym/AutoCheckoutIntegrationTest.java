package com.junglegym;

import com.junglegym.auth.AuthenticatedUser;
import com.junglegym.gym.*;
import com.junglegym.user.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AutoCheckoutIntegrationTest {
    @Autowired AutoCheckoutService autoCheckout;
    @Autowired GymService gym;
    @Autowired GymVisitRepository visits;
    @Autowired UserRepository users;
    @Autowired MockMvc mvc;
    private User user;

    @BeforeEach
    void setUp() {
        user = users.saveAndFlush(new User("auto@example.com", "auto-001", "auto-user", "자동 퇴실", "unused"));
    }

    @Test
    void overnightWorkoutStaysOpenUntilFourAndManualCheckoutKeepsActualDuration() {
        GymVisit visit = visit("2026-09-30T23:40:00");
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T01:00:00")));
        visit = visits.findById(visit.getId()).orElseThrow();
        assertNull(visit.getDurationMinutes());
        visit.checkOut("야간 운동", null);
        ReflectionTestUtils.setField(visit, "checkedOutAt", kst("2026-10-01T01:00:00"));
        assertEquals(80L, visit.getDurationMinutes());
        visits.saveAndFlush(visit);
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T04:00:00")));
        var saved = visits.findById(visit.getId()).orElseThrow();
        assertFalse(saved.isAutoCheckedOut());
        assertEquals(80L, saved.getDurationMinutes());
        assertEquals("야간 운동", saved.getWorkoutTitle());
    }

    @Test
    void forgottenVisitClosesAtFourWith59MinutesAndCanCheckInAgain() {
        var visit = visit("2026-09-30T11:30:00");
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T03:59:59")));
        var now = kst("2026-10-01T04:00:00");
        assertEquals(1, autoCheckout.closeExpiredVisits(now));
        var saved = visits.findById(visit.getId()).orElseThrow();
        assertTrue(saved.isAutoCheckedOut());
        assertEquals(59L, saved.getDurationMinutes());
        assertEquals(now, saved.getCheckedOutAt());
        assertEquals("", saved.getWorkoutTitle());
        assertFalse(visits.existsByUserIdAndCheckedOutAtIsNull(user.getId()));
        assertEquals(0, autoCheckout.closeExpiredVisits(now.plusSeconds(60)));
        assertNotEquals(visit.getId(), gym.checkIn(user.getId()).id());
    }

    @Test
    void recentVisitGetsFullTwoHourGrace() {
        var visit = visit("2026-10-01T03:40:00");
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T04:00:00")));
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T05:39:59")));
        assertEquals(1, autoCheckout.closeExpiredVisits(kst("2026-10-01T05:40:00")));
        assertEquals(59L, visits.findById(visit.getId()).orElseThrow().getDurationMinutes());
    }

    @Test
    void checkInAtFourBelongsToNewOperatingDay() {
        visit("2026-10-01T04:00:00");
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-01T04:00:00")));
        assertEquals(0, autoCheckout.closeExpiredVisits(kst("2026-10-02T03:59:59")));
        assertEquals(1, autoCheckout.closeExpiredVisits(kst("2026-10-02T04:00:00")));
    }

    @Test
    void catchesMissedRunsAndPreservesWorkoutData() {
        var visit = visit("2026-09-20T11:30:00");
        ReflectionTestUtils.setField(visit, "workoutTitle", "보존할 기록");
        ReflectionTestUtils.setField(visit, "workoutImageUrl", "https://example.com/workout.jpg");
        visits.saveAndFlush(visit);
        var now = kst("2026-10-01T14:20:00");
        assertEquals(1, autoCheckout.closeExpiredVisits(now));
        var saved = visits.findById(visit.getId()).orElseThrow();
        assertEquals(59L, saved.getDurationMinutes());
        assertEquals(now, saved.getCheckedOutAt());
        assertEquals("보존할 기록", saved.getWorkoutTitle());
        assertEquals("https://example.com/workout.jpg", saved.getWorkoutImageUrl());
    }

    @Test
    void historyExposes59MinutesAndAttendanceRemainsOnCheckInDate() throws Exception {
        visit("2026-09-30T11:30:00");
        autoCheckout.closeExpiredVisits(kst("2026-10-01T04:00:00"));
        var auth = authentication(new UsernamePasswordAuthenticationToken(AuthenticatedUser.from(user), null, List.of()));
        mvc.perform(get("/api/gym/visits").with(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].autoCheckedOut").value(true))
                .andExpect(jsonPath("$.data.content[0].durationMinutes").value(59))
                .andExpect(jsonPath("$.data.content[0].checkedOutAt").value("2026-09-30T19:00:00Z"));
        mvc.perform(get("/api/dashboard/calendar/attendance?year=2026&month=9").with(auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].date").value(30));
        mvc.perform(get("/api/dashboard/calendar/attendance?year=2026&month=10").with(auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void graceCanBeDisabledWithoutChangingRecorded59Minutes() {
        var visit = visit("2026-10-01T03:40:00");
        assertEquals(1, new AutoCheckoutService(visits, 0).closeExpiredVisits(kst("2026-10-01T04:00:00")));
        assertEquals(59L, visits.findById(visit.getId()).orElseThrow().getDurationMinutes());
        assertThrows(IllegalArgumentException.class, () -> new AutoCheckoutService(visits, -1));
    }

    private GymVisit visit(String checkedInAt) {
        var visit = new GymVisit(user);
        ReflectionTestUtils.setField(visit, "checkedInAt", kst(checkedInAt));
        return visits.saveAndFlush(visit);
    }

    private static Instant kst(String value) {
        return LocalDateTime.parse(value).atZone(ZoneId.of("Asia/Seoul")).toInstant();
    }
}
