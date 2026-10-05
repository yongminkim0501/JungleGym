package com.junglegym.gym;

import com.junglegym.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.Duration;

@Entity
@Table(name = "gym_visits")
public class GymVisit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "checked_in_at", nullable = false) private Instant checkedInAt;
    @Column(name = "checked_out_at") private Instant checkedOutAt;
    @Column(name = "auto_checked_out", nullable = false) private boolean autoCheckedOut;
    @Column(name = "active_user_id", unique = true) private Long activeUserId;
    @Column(name = "workout_title", nullable = false, length = 100) private String workoutTitle;
    @Column(name = "workout_image_url", length = 2048) private String workoutImageUrl;

    protected GymVisit() {}

    public GymVisit(User user) {
        this.user = user;
        this.checkedInAt = Instant.now();
        this.activeUserId = user.getId();
        this.workoutTitle = "";
    }

    public void checkOut(String title, String imageUrl) {
        if (checkedOutAt != null) throw new IllegalStateException("이미 퇴실한 기록입니다.");
        this.checkedOutAt = Instant.now();
        this.activeUserId = null;
        this.workoutTitle = title == null ? "" : title.trim();
        this.workoutImageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public Long memberId() { return user.getId(); }
    public Instant getCheckedInAt() { return checkedInAt; }
    public Instant getCheckedOutAt() { return checkedOutAt; }
    public boolean isAutoCheckedOut() { return autoCheckedOut; }
    public Long getDurationMinutes() {
        if (checkedOutAt == null) return null;
        return autoCheckedOut ? 59L : Math.max(0L, Duration.between(checkedInAt, checkedOutAt).toMinutes());
    }
    public String getWorkoutTitle() { return workoutTitle; }
    public String getWorkoutImageUrl() { return workoutImageUrl; }
}
