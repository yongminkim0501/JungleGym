package com.junglegym.dashboard;

import com.junglegym.gym.*;
import com.junglegym.auth.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.junglegym.dashboard.DashboardDtos.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private final GymVisitRepository visits;

    public DashboardService(GymVisitRepository visits) { this.visits = visits; }

    public DashboardResponse dashboard(AuthenticatedUser user) {
        YearMonth month = YearMonth.now(KST);
        Instant from = month.atDay(1).atStartOfDay(KST).toInstant();
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay(KST).toInstant();
        List<GymVisit> monthly = visits.findAllByUserIdAndCheckedInAtBetweenOrderByCheckedInAtAsc(user.id(), from, to);
        monthly = monthly.stream().filter(v -> v.getCheckedInAt().isBefore(to)).toList();
        List<GymVisit> streakCandidates = visits.findAllByUserIdOrderByCheckedInAtDesc(user.id());
        LocalDate monday = LocalDate.now(KST).with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Long> weeklyVisits = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            weeklyVisits.add(visits.countVisitorsBetween(monday.plusDays(i).atStartOfDay(KST).toInstant(),
                    monday.plusDays(i + 1).atStartOfDay(KST).toInstant()));
        }
        Map<Integer, WorkoutSummary> workoutEvents = new LinkedHashMap<>();
        for (GymVisit visit : monthly) {
            if (!visit.getWorkoutTitle().isBlank() || visit.getWorkoutImageUrl() != null)
                workoutEvents.put(visit.getCheckedInAt().atZone(KST).getDayOfMonth(),
                        new WorkoutSummary(visit.getWorkoutTitle(), visit.getWorkoutImageUrl(), visit.getCheckedInAt()));
        }
        long workoutCount = streakCandidates.stream().filter(v -> v.getCheckedOutAt() != null
                && (!v.getWorkoutTitle().isBlank() || v.getWorkoutImageUrl() != null)).count();
        List<Integer> attendanceDays = monthly.stream()
                .map(v -> v.getCheckedInAt().atZone(KST).getDayOfMonth()).distinct().toList();
        GymVisit recent = visits.findFirstByUserIdOrderByCheckedInAtDesc(user.id()).orElse(null);
        return new DashboardResponse(
                new UserSummary(user.nickname(), user.email(), user.profileImageUrl()),
                visits.existsByUserIdAndCheckedOutAtIsNull(user.id()),
                visits.countByCheckedOutAtIsNull(), 20, attendanceDays.size(), streak(streakCandidates), attendanceDays,
                recent == null ? null : new WorkoutSummary(recent.getWorkoutTitle(), recent.getWorkoutImageUrl(), recent.getCheckedInAt()),
                workoutCount, weeklyVisits, workoutEvents
        );
    }

    private int streak(List<GymVisit> monthly) {
        Set<LocalDate> dates = new HashSet<>();
        monthly.forEach(v -> dates.add(v.getCheckedInAt().atZone(KST).toLocalDate()));
        LocalDate cursor = LocalDate.now(KST);
        if (!dates.contains(cursor)) cursor = cursor.minusDays(1);
        int count = 0;
        while (dates.contains(cursor)) { count++; cursor = cursor.minus(1, ChronoUnit.DAYS); }
        return count;
    }

}
