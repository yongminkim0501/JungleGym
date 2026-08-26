from datetime import datetime, timezone, timedelta
import calendar

KST = timezone(timedelta(hours=9))
CENTER_CAPACITY = 20

class DashboardService:
    def __init__(self, repo, user_repo, gym_repo):
        self.repo = repo
        self.user_repo = user_repo
        self.gym_repo = gym_repo

    def get_current_cnt(self):
        return self.repo.get_gym_current_cnt()

    def get_daily_cnt(self):
        return self.repo.get_gym_daily_cnt()

    def get_user_month_log(self, email):
        return self.repo.get_user_month_log(email)

    def get_main_data(self, _id):
        current_cnt = self.get_current_cnt()
        daily_cnt = self.get_daily_cnt()
        month_log = self.get_user_month_log(_id)

        return {
            "current_cnt" : current_cnt,
            "daily_cnt" : daily_cnt,
            "month_log" : month_log
        }

    def get_profile_exercise_image_title(self, user_id: str):
        exercise_url, title =  self.repo.get_exercise_image_title(user_id = user_id)
        profile_url = self.user_repo.get_profile_image(user_id = user_id)

        return {
            "title": title,
            "exercise_url": exercise_url,
            "profile_url": profile_url
        }

    def get_monthly_attendance(self, user_id: str):
        now = datetime.now(KST)
        logs = self.repo.get_user_attendance_logs(user_id)
        attendance_dates = set()
        for log in logs:
            date = log["start_time"].astimezone(KST).date()

            if date.year == now.year and date.month == now.month:
                attendance_dates.add(date.day)
        return sorted(attendance_dates)

    def get_monthly_attendance_count(self, user_id: str):
        return len(self.get_monthly_attendance(user_id))

    def get_streak_days(self, user_id: str):
        logs = self.repo.get_user_attendance_logs(user_id)

        if not logs:
            return []

        workout_dates = []
        prev_date = None

        for log in logs:
            current_date = log["start_time"].astimezone(KST).date()

            if current_date != prev_date:
                workout_dates.append(current_date)
                prev_date = current_date

        today = datetime.now(KST).date()

        if workout_dates[0] not in (
                today,
                today - timedelta(days=1)
        ):
            return []

        streak_dates = [workout_dates[0]]

        for i in range(len(workout_dates) - 1):
            if workout_dates[i] - workout_dates[i + 1] == timedelta(days=1):
                streak_dates.append(workout_dates[i + 1])
            else:
                break

        if len(streak_dates) < 2:
            return []

        return sorted([
            date.day
            for date in streak_dates
            if date.year == today.year and date.month == today.month
        ])

    def get_streak_count(self, user_id: str):
        return len(self.get_streak_days(user_id))

    def get_profile_data(self, user_id):
        data = self.user_repo.get_email(user_id)
        email = data["email"]
        monthly_attendance_count = self.get_monthly_attendance_count(user_id)
        workout_count = self.get_streak_count(user_id)

        return {
            "email": email,
            "monthly_attendance_count": monthly_attendance_count,
            "workout_count": workout_count
        }

    def get_recent_img(self, user_id):
        data = self.gym_repo.find_imagepath_by_id(user_id)
        img = data["exercise_url"] if data else None
        return {
            "recent_workout": {
                "image_url": img
            }
        }

    def make_calender(self):
        now = datetime.now(KST)
        year = now.year
        month = now.month
        cal = calendar.Calendar(firstweekday=6)
        weeks = cal.monthdayscalendar(year, month)

        return [
            day
            for week in weeks
            for day in week
        ]

    def get_recent_log(self, user_id):
        data = self.gym_repo.find_imagepath_by_id(user_id)
        img = data["exercise_url"]
        return {
            "recent_workout": {
                "image_url": img
            }
        }

    def get_workout_event(self, user_id):
        now = datetime.now(KST)
        logs = self.repo.get_user_attendance_logs(user_id)

        workout_events = {}

        for log in logs:
            date = log["start_time"].astimezone(KST).date()

            if date.year != now.year or date.month != now.month:
                continue
            if date.day in workout_events:
                continue
            if not log.get("title") and not log.get("exercise_url"):
                continue
            workout_events[date.day] = {
                "memo": log.get("title") or "",
                "photo_url": log.get("exercise_url") or ""
            }
        return workout_events

    def get_attendance(self, user_id):
        now = datetime.now(KST)
        return {
            "attendance": {
                "streak_count": self.get_streak_count(user_id),
                "calendar_days": self.make_calender(),
                "calendar_month": now.month,
                "attendance_days": self.get_monthly_attendance(user_id),
                "streak_days": self.get_streak_days(user_id),
                "workout_events": self.get_workout_event(user_id),
            }
        }

    def get_dashboard_data(self, user_id):
        return {
            "profile": self.get_profile_data(user_id),
            **self.get_recent_img(user_id),
            "center_status": {
                "current_count": self.get_current_cnt(),
                "capacity": CENTER_CAPACITY
            },
            **self.get_attendance(user_id),
            "weekly_visits": {
                "counts": [day["user_cnt"] for day in self.get_daily_cnt()]
            }
        }








