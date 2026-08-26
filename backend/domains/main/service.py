from domains.main.repo import MainRepository

class MainService:
    def __init__(self, db):
        self.main_repository = MainRepository(db)

    def get_current_cnt(self):
        return self.main_repository.get_gym_current_cnt()

    def get_daily_cnt(self):
        return self.main_repository.get_gym_daily_cnt()

    def get_user_month_log(self, email):
        return self.main_repository.get_user_month_log(email)

    def get_main_data(self, _id):
        current_cnt = self.get_current_cnt()
        daily_cnt = self.get_daily_cnt()
        month_log = self.get_user_month_log(_id)

        return {
            "current_cnt" : current_cnt,
            "daily_cnt" : daily_cnt,
            "month_log" : month_log
        }


    
    
    





