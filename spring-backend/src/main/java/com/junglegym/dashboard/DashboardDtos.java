package com.junglegym.dashboard;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record UserSummary(String nickname, String email, String profileImageUrl) {}
    public record WorkoutSummary(String title, String imageUrl, Instant checkedInAt) {}
    public record DashboardResponse(UserSummary user, boolean checkedIn, long currentVisitors, int capacity,
                                    int monthlyAttendance, int streakDays, List<Integer> attendanceDays,
                                    WorkoutSummary recentWorkout, long workoutCount, List<Long> weeklyVisits,
                                    Map<Integer, WorkoutSummary> workoutEvents) {}
}
