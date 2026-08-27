from flask import Blueprint, request, g, jsonify, redirect
from dependency_injector.wiring import inject, Provide

from ...containers import ApplicationContainers
from backend.domains.gym.service import GymService

gym_bp = Blueprint('gym', __name__, url_prefix="/api/gym")

@gym_bp.route("/check-in", methods = ["POST"])
@inject
def check_in(
        gym_service:GymService = Provide[ApplicationContainers.gym_service]
):
    user_id = g.user_id
    gym_service.gym_in(user_id = user_id)
    return jsonify({"success": True}), 200

@gym_bp.route("/check-out", methods=["POST"])
@inject
def check_out(
        gym_service: GymService = Provide[ApplicationContainers.gym_service]
):
    raw_data = request.get_json(silent=True) or {} # base64 데이터

    title = raw_data.get("title") or ""
    image_data = raw_data.get("image") or ""

    if image_data:
        gym_service.gym_out_with_image(user_id=g.user_id, title=title, image_data=image_data)
    else:
        gym_service.gym_out(user_id=g.user_id, title=title)

    return jsonify({"success": True,}), 200