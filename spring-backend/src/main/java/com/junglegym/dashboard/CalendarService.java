package com.junglegym.dashboard;

import com.junglegym.common.BusinessException;
import com.junglegym.gym.GymVisit;
import com.junglegym.gym.GymVisitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.junglegym.dashboard.CalendarDtos.*;

@Service
@Transactional(readOnly = true)
public class CalendarService {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private final GymVisitRepository visits;

    public CalendarService(GymVisitRepository visits) {
        this.visits = visits;
    }

    public List<CalendarDay> calendar(Long userId, int year, int month) {
        if (year < 1 || year > 9999 || month < 1 || month > 12) {
            throw new BusinessException("INVALID_REQUEST", "year는 1~9999, month는 1~12여야 합니다.",
                    HttpStatus.BAD_REQUEST);
        }
        YearMonth requestedMonth = YearMonth.of(year, month);
        var from = requestedMonth.atDay(1).atStartOfDay(KST).toInstant();
        var to = requestedMonth.plusMonths(1).atDay(1).atStartOfDay(KST).toInstant();
        List<GymVisit> monthly = visits.findCalendarVisits(userId, from, to);
        Map<Integer, GymVisit> daily = new HashMap<>();
        for (GymVisit visit : monthly) {
            int day = visit.getCheckedInAt().atZone(KST).getDayOfMonth();
            // Rows are ordered by check-in time and ID. An empty later visit must
            // not erase an earlier workout; title and image always stay together.
            if (!daily.containsKey(day) || hasWorkout(visit)) {
                daily.put(day, visit);
            }
        }

        List<CalendarDay> days = new ArrayList<>(requestedMonth.lengthOfMonth());
        for (int day = 1; day <= requestedMonth.lengthOfMonth(); day++) {
            GymVisit visit = daily.get(day);
            days.add(new CalendarDay(day, visit != null,
                    visit == null ? "" : visit.getWorkoutTitle(),
                    visit == null || visit.getWorkoutImageUrl() == null ? "" : visit.getWorkoutImageUrl()));
        }
        return List.copyOf(days);
    }

    public List<AttendanceDay> attendance(Long userId, int year, int month) {
        return calendar(userId, year, month).stream()
                .filter(CalendarDay::ischeck)
                .map(day -> new AttendanceDay(day.date(), day.title(), day.imageUrl()))
                .toList();
    }

    private boolean hasWorkout(GymVisit visit) {
        return !visit.getWorkoutTitle().isBlank()
                || (visit.getWorkoutImageUrl() != null && !visit.getWorkoutImageUrl().isBlank());
    }
}
