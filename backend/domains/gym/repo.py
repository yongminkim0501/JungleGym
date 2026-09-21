from datetime import datetime, timezone, timedelta

from pymongo import ReturnDocument, DESCENDING


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
                "title": '',
                "exercise_url": ''
            }

            self.collection.insert_one(gym_log)
            return True
        except Exception as e:
            raise False # 임시

    def find_imagepath_by_id(self, user_id):
        data = self.collection.find_one(
            {"user_id": user_id },
            sort=[("start_time", DESCENDING)]
        )
        if data is None:
            return None
        return data

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
            sort = [("start_time", DESCENDING)],
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
            sort=[("start_time", DESCENDING)],
            return_document = ReturnDocument.AFTER
        )
        return data

    def get_gym_log(self, user_id: str):
        data = list(self.collection.find({
            "user_id":user_id
            }).sort("start_time", -1).limit(20))


        response_list = []
        for item in data:
            temp_struct = {
                "start_time":item["start_time"],
                "end_time":item["end_time"]
            }
            response_list.append(temp_struct)

        return list(reversed(response_list))