package com.junglegym.dashboard;

import com.junglegym.auth.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/calendar")
public class CalendarController {
    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    List<CalendarDtos.CalendarDay> calendar(@AuthenticationPrincipal AuthenticatedUser user,
                                          @RequestParam("year") int year,
                                          @RequestParam("month") int month) {
        return calendarService.calendar(user.id(), year, month);
    }

    @GetMapping("/attendance")
    List<CalendarDtos.AttendanceDay> attendance(@AuthenticationPrincipal AuthenticatedUser user,
                                              @RequestParam("year") int year,
                                              @RequestParam("month") int month) {
        return calendarService.attendance(user.id(), year, month);
    }
}
