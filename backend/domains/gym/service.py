class GymService:
    def __init__(self, user_repo, gym_repo):
        self.user_repo = user_repo
        self.gym_repo = gym_repo

    def gym_in(self, user_id : str):
        if not self._is_gym(user_id = user_id): # if True면 gym에 현재 입장 상태입니다.
            self.gym_repo.set_gym_log(user_id = user_id)
            return self.user_repo.gym_in_status(user_id = user_id)  # 사용자가 Gym에 입실한 상태로 변경
        return False

    def gym_out(self, user_id : str):
        if self._is_gym(user_id = user_id): # if False면 gym에 현재 입장 상태가 아닙니다.
            self.gym_repo.update_gym_log_end_time(user_id = user_id)
            return self.user_repo.gym_out_status(user_id = user_id) # 사용자가 Gym에 퇴실한 상태로 변경
        return False

    def _is_gym(self, user_id: str) -> bool:
        if self.user_repo.check_status(user_id): # 현재 사용자가 Gym에 입장한 상태인지 판별하는 코드
            return True
        return False