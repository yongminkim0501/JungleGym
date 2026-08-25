class UserService:
    def __init__(self, repo, image_repo):
        self.repo = repo
        self.image_repo = image_repo

    def sign_up(self, *, email, nickname, name, password):
        user:dict = {
            "email" : email,
            "nickname" : nickname,
            "name": name,
            "password": password,
            "enter_room_status": False,
        }

        user_inserted_id : str = self.repo.create(user = user)
        return user_inserted_id

