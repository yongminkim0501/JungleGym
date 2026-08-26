from domains.dashboard.repo import DashboardRepository

class DashboardService:
    def __init__(self, repo, user_repo):
        self.repo = repo
        self.user_repo = user_repo

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

    
    
    





