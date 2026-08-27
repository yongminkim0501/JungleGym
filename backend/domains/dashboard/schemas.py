# from pydantic import BaseModel, Field

# class MainPageDashboard(BaseModel):
#     fitness_cnt_status: FitnessCntStatus
#     my_calendar: MyCalendar
#     weeklyUsage: WeeklyDailyUsage

# class FitnessCntStatus(BaseModel):
#     current_count: int = Field(..., description="현재 헬스장 이용자 수")
#     congestion: str = Field(..., description="혼잡도 상태 (여유, 보통, 혼잡, 매우 혼잡)")

# class MyCalendar(BaseModel):
#     attendance_date: list[str] = Field(..., ,description="출석 날짜 리스트")
    

# class DailyUsage(BaseModel):
#     date : str
#     user_count : int

# class WeeklyDailyUsage(BaseModel):
#     week : list[DailyUsage]

    