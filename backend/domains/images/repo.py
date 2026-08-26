import os

import cloudinary.uploader
import cloudinary
import cloudinary.uploader

API_KEY = os.getenv("CLOUDINARY_API_KEY")

class ImageRepository:
    def __init__(self, db):
        cloudinary.config(
            cloud_name="bhrv5jri",
            api_key="313521525263326",
            api_secret=API_KEY,
            secure=True
        )
        self.cloud = cloudinary
        self.collection = db.user_image

    def set_image_collection(self, user_image_data:dict):
        result = self.collection.insert_one(user_image_data)
        return str(result.inserted_id)

    def update_profile_image_collection(self, user_id:str, path:str):
        result = self.collection.update_one({
            "user_id" : user_id
        },
            {
                "$set":{
                    "profile_image":path
                }
            }
        )
        if result.matched_count == 0 : return False
        return True

    def get_recent_image_path(self, user_id: str):
        image_data = self.collection.find_one({
            "user_id":user_id
        })
        return image_data["profile_image"]

    def update_exercise_image_collection(self, user_id:str, path: str):
        result = self.collection.update_one({
            "user_id": user_id
        },{
           "$set":{"exercise_image":path}
        })

        if result.matched_count == 0 : return False
        return True

    def update_profile_image_collections(self, user_id:str, path:str):
        result = self.collection.update_one({
            "user_id": user_id
        }, {
            "$set": {"profile_image": path}
        })

        if result.matched_count == 0: return False
        return True

    def image_upload(self, image_path):
        response = self.cloud.uploader.upload(
            image_path,
            use_filename = True,
            unique_filename = False
        )

        secure_url = response.get("secure_url")
        public_id = response.get("public_id")

        return {
            "secure_url" : secure_url,
            "public_id" : public_id
        }

    def destroy_by_extract_public_id(self, path): # 여기서 Path 는 과거의 주소
        list_path = list(path.split("/"))
        public_id_extension = list_path[-1]
        temp_list = list(public_id_extension.split("."))
        public_id = temp_list[0]

        result = self.cloud.uploader.destroy(public_id, invalidate=False)

        if result.get("result") == "ok":
            return False
        return True