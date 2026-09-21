from datetime import datetime
from typing import Optional, TypedDict

from ..view_models.common import BaseViewData


class AccessHistoryData(TypedDict):
    start: datetime
    end: Optional[datetime]


class MypageInfoData(TypedDict):
    monthly_attendance_count: int
    workout_count: int


class MypageHistoryData(TypedDict):
    access_history: list[AccessHistoryData]


class MypageInfoViewData(BaseViewData):
    mypage: MypageInfoData


class MypageHistoryViewData(BaseViewData):
    mypage: MypageHistoryData
