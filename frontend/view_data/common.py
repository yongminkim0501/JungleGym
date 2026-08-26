from flask import g

from ..view_models.common import BaseViewData
from backend.core.current_user import get_current_user

def build_common_data()->BaseViewData:
    if g.is_login == True :
        cur_user = get_current_user()
        nickname = cur_user["nickname"]
        email = cur_user["email"]
        image_path = cur_user["image_path"]
        status = cur_user["enter_room_status"]
    else:
        nickname = ""
        image_path = ""
        email = ""
        status = False
    return {
        "session": {
            "is_login": g.is_login,
            "user_name": nickname,
            "email": email,
            "profile_image_url": image_path,
            "status": status
        }
    }