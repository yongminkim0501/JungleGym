from pickle import APPENDS

from flask import g
from dependency_injector.wiring import Provide, inject

from backend.api.v1.containers import ApplicationContainers
from backend.domains.dashboard.service import DashboardService
from ..view_data.common import build_common_data
from ..view_models.dashboard import DashboardData

@inject
def build_dashboard_data(dashboard_service: DashboardService = Provide(ApplicationContainers.dashboard_service)) -> DashboardData:
    data = dashboard_service.get_dashboard_data(user_id = g.user_id)
    return {
        **build_common_data(),
        **data,
    }