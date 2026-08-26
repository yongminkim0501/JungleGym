from datetime import datetime, timezone

from pymongo import ReturnDocument

class GymRepository:
    def __init__(self, db):
        self.collection = db.gym_logs
        # gym_logs의 구조 : user_id, startime (created at), endtime

    def set_gym_log(self, user_id: str):
        try:
            gym_log = {
                "user_id": user_id,
                "start_time": datetime.now(timezone.utc),
                "end_time":  None,
                "title": None,
                "exercise_url": None
            }

            self.collection.insert_one(gym_log)
            return True
        except Exception as e:
            raise False # 임시

    def update_gym_log_end_time(self, user_id: str, title: str, exercise_url: str):
        data = self.collection.find_one_and_update(
        {
            "user_id":user_id
        },
            {
            "$set" : {
                "end_time": datetime.now(timezone.utc),
                "title": title,
                "exercise_url": exercise_url
            }
        },
            return_document = ReturnDocument.AFTER
        )

        return data

    def update_gym_log_end_time_without_image(self, user_id: str, title: str):
        data = self.collection.find_one_and_update(
        {
            "user_id":user_id
        },
            {
            "$set" : {
                "end_time": datetime.now(timezone.utc),
                "title": title,
            }
        },
            return_document = ReturnDocument.AFTER
        )

        return data


