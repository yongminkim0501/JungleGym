from datetime import datetime, timezone, timedelta

#current active user count(현제 사용자 수)
active_user = dbjungle.users.find({"enter_room_status" : True})
cnt = 0
for in_gym_cnt in active_user:
    cnt += 1
return cnt

#daily user count(주간 사용 누적)
KST = timezone(timedelta(hours=9))
now = datetime.now(KST)
start_day = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
end_day = start_day + timedelta(days=7)
each_day_cnt = []
for i in range(7):
    cnt = 0
    day = start_day + timedelta(days=i)
    end_day = day + timedelta(days=1)
    start_day_utc = day.astimezone(timezone.utc)
    end_day_utc = end_day.astimezone(timezone.utc)
    result = dbjungle.gym_logs.find({"start_time" : {"$gte" : start_day_utc, "$lt" : end_day_utc}})
    for daily_user_count in result:
        cnt += 1
    each_day_cnt.append(cnt)
return each_day_cnt

#

#comulative date(달 누적)
user_logs = dbjungle.gym_logs.find({"user_id" : user_id})
cnt = 0
for comulative_date in user_logs:
    if(comulative_date["endtime"] != None ):
        cnt += 1
return cnt