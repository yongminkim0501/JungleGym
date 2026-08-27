from datetime import datetime, timezone

from bson import ObjectId

class UserRepository:
    def __init__(self, db):
        self.collection = db.users

    def find_by_email(self, email: str):
        return self.collection.find_one({'email': email.lower().strip()})

    def get_email(self, user_id):
        data = self.collection.find_one({"_id":ObjectId(user_id)})
        return data

    def find_by_nickname(self, nickname: str):
        return self.collection.find_one({'nickname': nickname})

    def get_profile_image(self, user_id):
        data = self.collection.find_one({"_id":ObjectId(user_id)})
        return data["image_path"]

    def get_user(self, user_id):
        data = self.collection.find_one({"_id": ObjectId(user_id)})
        return data

    def update_pw_by_email(self, email, password):
        return self.collection.update_one({
            "email":email
        },{
            "$set":{
                "password":password
            }
        })

    '''def update_title(self, user_id:str, title:str):
        result = self.collection.update_one({
            "_id": ObjectId(user_id)
        },{
            "$set":{'title':title}
        })
        if result.matched_count == 0 : return False
        return True'''

    def create(self, user: dict) -> str:
        user['created_at'] = datetime.now(timezone.utc)
        result = self.collection.insert_one(user)
        return str(result.inserted_id)

    def check_status(self, user_id : str):
        user = self.collection.find_one({
            "_id": ObjectId(user_id)
                                        })
        return user["enter_room_status"]

    def gym_in_status(self, user_id: str):
        result = self.collection.update_one({
            "_id": ObjectId(user_id), "enter_room_status":False
        },
            {
                "$set":{'enter_room_status':True}
            }
        )
        if result.matched_count == 0 : return False
        return True


    def gym_out_status(self, user_id: str):
        result = self.collection.update_one({
            "_id": ObjectId(user_id), "enter_room_status":True
        },
            {
                "$set": {'enter_room_status': False}
            }
        )
        if result.matched_count == 0 : return False
        return True

    def update_profile(self, user_id:str, image_path:str):
        self.collection.update_one({
            "_id": ObjectId(user_id)
        },
            {
                "$set":{
                    "image_path":image_path
                }
            }
        )