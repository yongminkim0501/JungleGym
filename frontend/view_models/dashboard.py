from typing import TypedDict

from ..view_models.common import BaseViewData


class ProfileData(TypedDict):
    monthly_attendance_count: int
    workout_count: int


class RecentWorkoutData(TypedDict):
    image_url: str


class CenterStatusData(TypedDict):
    current_count: int
    capacity: int



class WorkoutEventData(TypedDict):
    memo: str
    photo_url: str


class AttendanceData(TypedDict):
    calendar_month: int
    streak_count: int
    calendar_days: list[int]
    attendance_days: list[int]
    streak_days: list[int]
    workout_events: dict[int, WorkoutEventData]

class WeeklyVisitsData(TypedDict):
    counts: list[int]


class DashboardData(BaseViewData):
    profile: ProfileData
    recent_workout: RecentWorkoutData
    center_status: CenterStatusData
    attendance: AttendanceData
    weekly_visits: WeeklyVisitsData
