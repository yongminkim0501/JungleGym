from pydantic import EmailStr


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
            "image_path": None,
            "enter_room_status": False,
        }

        user_inserted_id : str = self.repo.create(user = user)

        '''user_image:dict = {
            "user_id": user_inserted_id,
            "profile_image" : None,
            "exercise_image": None
        }

        self.image_repo.set_image_collection(user_image_data = user_image)
        '''
        return user_inserted_id

    def update_pw_by_email(self, email:EmailStr, password:str):
        self.repo.update_pw_by_email(email=email, password=password)
        return True

    def update_profile_image_by_user_id(self, user_id: str, profile_image_data: str):
        recent_profile_url = self.image_repo.get_recent_image_path(user_id = user_id)
        self.image_repo.destroy_by_extract_public_id(path=recent_profile_url) # bool 형태로 success, false 반호나
        stored_data: dict = self.image_repo.image_upload(profile_image_data)
        secure_path = stored_data["secure_path"]
        result = self.image_repo.update_profile_image_collections(user_id = user_id, image_path = secure_path)
        if result :
            return True
        else:
            return False
            # 실패한 경우

    def get_user(self, user_id : str):
        user_data = self.repo.get_user(user_id=user_id)
        return user_data

    def get_name_profile_by_id(self, user_id: str):
        user_data = self.repo.get_user(user_id = user_id)
        return user_data["image_path"], user_data["nickname"]