from flask import Blueprint, g
from dependency_injector.wiring import inject, Provide

from domains.dashboard.service import DashboardService
from ...containers import ApplicationContainers

dashboard_bp = Blueprint('dashboard', __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/profile", methods = ["GET"])
@inject
def get_profile(
        dashboard_service: DashboardService = Provide[ApplicationContainers.dashboard_service]
):
    user_id = g.user_id
    data = dashboard_service.get_profile_exercise_image_title(user_id = user_id)
    return data