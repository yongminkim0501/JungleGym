from datetime import datetime, timezone, timedelta

from bson import ObjectId

class DashboardRepository:
    def __init__(self, db):
        self.collection_u = db.users
        self.collection_log = db.gym_logs

    def find_by_id(self, id):
        return self.collection_u.find_one({'_id' : ObjectId(id)})

    def find_by_email(self, email: str):
        return self.collection_u.find_one({'email': email.lower().strip()})

    def find_by_nickname(self, nickname: str):
        return self.collection_u.find_one({'nickname': nickname})

    def create(self, user: dict) -> str:
        user['created_at'] = datetime.now(timezone.utc)
        result = self.collection_u.insert_one(user)
        return str(result.inserted_id)

    def check_status(self, user_id : str):
        user = self.collection_u.find_one({
            "_id": ObjectId(user_id)
                                        })
        return user["enter_room_status"]

    def gym_in_status(self, user_id: str):
        result = self.collection_u.update_one({
            "_id": ObjectId(user_id), "enter_room_status":False
        },
            {
                "$set":{'enter_room_status':True}
            }
        )
        if result.matched_count == 0 : return False
        return True


    def gym_out_status(self, user_id: str):
        result = self.collection_u.update_one({
            "_id": ObjectId(user_id), "enter_room_status":True
        },
            {
                "$set": {'enter_room_status': False}
            }
        )
        if result.matched_count == 0 : return False
        return True

    def get_email(self, user_id:str):
        return self.collection_u.find_one({
            "user_id" : user_id
        })["email"]

    def get_gym_current_cnt(self):
        return self.collection_u.count_documents({
            'enter_room_status':True
        })

    def get_gym_weekly_cnt(self):
        KST = timezone(timedelta(hours=9))
        now = datetime.now(KST)
        start_day = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        weekly_cnt = []

        for i in range(7):
            day = start_day + timedelta(days=i)
            end_day = day + timedelta(days=1)

            start_day_utc = day.astimezone(timezone.utc)
            end_day_utc = end_day.astimezone(timezone.utc)

            user_in_day = self.collection_log.distinct(
                "user_id",{
                    "startime":{
                        "$gte" : start_day_utc,
                        "$lt" : end_day_utc
                    }
                }
            )

            weekly_cnt.append(len(user_in_day))
        return weekly_cnt
    
    def get_user_month_log(self, _id):
        KST = timezone(timedelta(hours=9))
        now = datetime.now(KST)

        start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start_month == 12:
            end_month = start_month.replace(
                year= start_month.year + 1,
                month=1
            )
        else:
            end_month = start_month.replace(
                month=start_month+1
            )
        
        user_log = self.collection_log.find({
            "_id" : _id,
            "starttime" : {
                "$gte" : start_month,
                "$lt" : end_month
            }
        })

        return user_log

    def get_exercise_image(self, user_id: str):
        data = self.collection_log.find_one({"user_id":user_id})
        exercise_url = data["exercise_url"]
        title = data["title"]
        return exercise_url, title

    #유저id로 로그 검색
    def get_user_attendance_logs(self, user_id: str):
        return list(
            self.collection_log.find(
                {"user_id" : user_id},
                {"_id" : 0, "start_time": 1}
            ).sort("start_time", -1)
        )

    def get_user_img(self, user_id : str):
        user = self.collection_u.findone(
            {"user_id": user_id},
            {"user_id": 0, "imagepath": 1}
        )
        if user is None:
            return None
        return user["imagepath"]
        
            

    