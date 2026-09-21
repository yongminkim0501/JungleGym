from flask import render_template, Blueprint, g

from core.current_user import get_current_user

auth_bp = Blueprint('auth', __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])

def build_common_data(
):
    if g.is_login == True :
        cur_user = get_current_user()
        nickname = cur_user["nickname"]
        image_path = cur_user["image_path"]
    else:
        nickname = ""
        image_path = ""
    return {
        "session": {
            "is_login": g.is_login,
            "user_name": nickname,
            "profile_image_url": image_path,
        },
        "navigation": {
            "profile_links": [
                {"label": "내 프로필", "url": "/mypage/info"},
                {"label": "활동기록", "url": "/mypage/history"},
            ],
            "register": {"label": "회원가입", "url": "/register"},
            "login": {"label": "로그인", "url": "/login"},
        },
    }

def build_verification_copy():
    return {
        "email": {
            "label": "이메일",
            "placeholder": "이메일을 입력해주세요.",
        },
        "code": {
            "label": "인증코드",
            "placeholder": "인증코드 6자리를 입력해주세요.",
        },
        "send_code_label": "코드 전송",
        "resend_code_label": "코드 재전송",
        "next_label": "다음",
        "initial_timer": "05:00",
        "expires_in_seconds": 300,
        "resend_after_seconds": 180,
    }

def build_find_password_data():
    return {
        **build_common_data(),
        "page": {
            "browser_title": "비밀번호 찾기",
            "heading": "비밀번호 찾기",
            "verification": build_verification_copy(),
            "reset": {
                "password": {
                    "label": "새로운 비밀번호",
                    "placeholder": "비밀번호를 입력해주세요.",
                },
                "password_confirm": {
                    "label": "비밀번호 확인",
                    "placeholder": "비밀번호를 입력해주세요.",
                },
                "available_time_label": "비밀번호 변경 가능 시간",
                "initial_timer": "05:00",
                "submit_label": "비밀번호 초기화",
            },
            "back_link": {"label": "로그인으로 돌아가기", "url": "/login"},
        },
    }