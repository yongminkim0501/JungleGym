package com.junglegym.gym;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutoCheckoutService {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final LocalTime CLOSING_TIME = LocalTime.of(4, 0);
    private final GymVisitRepository visits;
    private final int graceMinutes;

    public AutoCheckoutService(GymVisitRepository visits,
            @Value("${app.gym.auto-checkout.grace-minutes:120}") int graceMinutes) {
        if (graceMinutes < 0) throw new IllegalArgumentException("auto-checkout grace-minutes must be nonnegative");
        this.visits = visits;
        this.graceMinutes = graceMinutes;
    }

    @Transactional
    public int closeExpiredVisits(Instant now) {
        var localNow = now.atZone(KST);
        var boundary = localNow.toLocalDate().atTime(CLOSING_TIME).atZone(KST);
        if (localNow.isBefore(boundary)) boundary = boundary.minusDays(1);
        // Visits at/after 04:00 belong to the new operating day. Visits just
        // before 04:00 stay open until their grace period has elapsed.
        return visits.closeExpiredVisits(now, boundary.toInstant(), now.minus(graceMinutes, ChronoUnit.MINUTES));
    }
}
