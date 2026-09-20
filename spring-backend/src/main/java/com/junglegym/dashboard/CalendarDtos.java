package com.junglegym.dashboard;

import com.fasterxml.jackson.annotation.JsonProperty;

public final class CalendarDtos {
    private CalendarDtos() {}

    public record CalendarDay(int date, boolean ischeck, String title,
                              @JsonProperty("img_url") String imageUrl) {}

    public record AttendanceDay(int date, String title,
                                @JsonProperty("img_url") String imageUrl) {}
}
