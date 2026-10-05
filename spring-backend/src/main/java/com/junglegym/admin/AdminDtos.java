package com.junglegym.admin;

import com.junglegym.user.User;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}
    public record Login(@NotBlank @Size(max = 256) String token) {}
    public record UpdateMember(@NotBlank @Size(max = 50) String name,
            @NotBlank @Size(min = 4, max = 25) String nickname,
            @NotBlank @Email @Size(max = 255) String email,
            @NotNull @Pattern(regexp = "active|suspended") String status,
            @NotNull @Size(max = 500) String note, @NotNull @PositiveOrZero Long revision) {
        public UpdateMember {
            if (name != null) name = name.trim();
            if (nickname != null) nickname = nickname.trim();
            if (email != null) email = email.trim().toLowerCase(java.util.Locale.ROOT);
            if (note != null) note = note.trim();
        }
    }
    public record Member(String id, String name, String nickname, String email, String jungleNumber,
            String status, Instant joinedAt, String note, long revision) {
        public static Member from(User user) {
            return new Member(user.getId().toString(), user.getName(), user.getNickname(), user.getEmail(),
                    user.getJungleNumber() == null ? "" : user.getJungleNumber(),
                    user.isSuspended() ? "suspended" : "active", user.getCreatedAt(), user.getAdminNote(), user.getAdminRevision());
        }
    }
    public record Activity(String id, String userId, String type, Instant at,
            String result, String detail, String actor, String actorName) {}
    public record Data(int version, Instant generatedAt, List<Member> users, List<Activity> events) {}
    public record Metrics(Instant generatedAt, Instant startedAt, long uptimeSeconds, Jvm jvm, Db db,
            List<EndpointMetric> endpoints, List<MetricPoint> history) {}
    public record Jvm(long heapUsedMb, long heapMaxMb) {}
    public record Db(Integer active, Integer idle, Integer pending, Integer max) {}
    public record EndpointMetric(String method, String uri, long count, Double meanMs, Double p95Ms,
            Double maxMs, long clientErrors, long serverErrors) {}
    public record MetricPoint(Instant at, long requests, long clientErrors, long serverErrors, Double meanMs,
            long heapUsedMb, Integer dbActive) {}
}
