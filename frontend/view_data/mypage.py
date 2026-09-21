from dependency_injector.wiring import Provide, inject
from flask import g

from backend.api.v1.containers import ApplicationContainers
from backend.domains.dashboard.service import DashboardService
from backend.domains.gym.service import GymService
from ..view_data.common import build_common_data
from ..view_models.mypage import (
    AccessHistoryData,
    MypageHistoryViewData,
    MypageInfoViewData,
)


@inject
def build_mypage_info_data(
    dashboard_service: DashboardService = Provide[ApplicationContainers.dashboard_service],
) -> MypageInfoViewData:
    profile = dashboard_service.get_profile_data(g.user_id)

    return {
        **build_common_data(),
        "mypage": {
            "monthly_attendance_count": profile["monthly_attendance_count"],
            "workout_count": profile["workout_count"],
        },
    }


@inject
def build_mypage_history_data(
    gym_service: GymService = Provide[ApplicationContainers.gym_service],
) -> MypageHistoryViewData:
    logs = gym_service.get_gym_my_record(g.user_id)
    access_history: list[AccessHistoryData] = [
        {"start": log["start_time"], "end": log["end_time"]}
        for log in logs
    ]

    return {
        **build_common_data(),
        "mypage": {
            "access_history": access_history,
        },
    }
