from flask import Blueprint, request, g
from dependency_injector.wiring import inject, Provide

from ...containers import ApplicationContainers
from domains.gym.service import GymService

gym_bp = Blueprint('gym', __name__, url_prefix="/api/gym")

@gym_bp.route("/in", methods = ["GET", "POST"])
@inject
def check_in(
        gym_service:GymService = Provide[ApplicationContainers.gym_service]
):
    user_id = request.get_json()["user_id"]
    gym_service.gym_in(user_id = user_id)
    return {
        "success": "임시 코드로 check_in 통과"
    }

@gym_bp.route("/out", methods=["POST"])
@inject
def check_out(
        gym_service: GymService = Provide[ApplicationContainers.gym_service]
):
    raw_data = request.get_json(silent=True) # base64 데이터

    title = raw_data["title"]
    image_data = raw_data["image"]

    if not raw_data :
        gym_service.gym_out(user_id = g.user_id, title = title)
    else:
        gym_service.gym_out_with_image(user_id=g.user_id, title = title ,image_data = image_data)

    return {
        "success":"임시 코드로 check_out 통과"
    }
