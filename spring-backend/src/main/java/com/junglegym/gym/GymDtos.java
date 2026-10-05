package com.junglegym.gym;

import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class GymDtos {
    private GymDtos() {}

    public record CheckOutRequest(@Size(max = 100) String title, String image) {}

    public record VisitResponse(Long id, Instant checkedInAt, Instant checkedOutAt, String title, String imageUrl,
                                boolean autoCheckedOut, Long durationMinutes) {
        public static VisitResponse from(GymVisit visit) {
            return new VisitResponse(visit.getId(), visit.getCheckedInAt(), visit.getCheckedOutAt(),
                    visit.getWorkoutTitle(), visit.getWorkoutImageUrl(), visit.isAutoCheckedOut(), visit.getDurationMinutes());
        }
    }

    public record HistoryResponse(List<VisitResponse> content, int page, int totalPages, long totalElements) {}
}
