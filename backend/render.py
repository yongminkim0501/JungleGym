from pathlib import Path

from flask import Flask, render_template

from view_models.auth import (
    FindIdViewData,
    FindPasswordViewData,
    LoginViewData,
    RegisterViewData,
    VerificationCopyData,
)
from view_models.common import BaseViewData
from view_models.dashboard import DashboardData
from view_models.mypage import MypageViewData
from view_models.qr import QRComponentsData, QRResultViewData, QRViewData

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)


def build_common_data(
    *,
    is_login: bool = False,
    user_name: str = "",
    profile_image_url: str = "",
) -> BaseViewData:
    return {
        "session": {
            "is_login": is_login,
            "user_name": user_name,
            "profile_image_url": profile_image_url,
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


def build_verification_copy() -> VerificationCopyData:
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


def build_qr_components_data() -> QRComponentsData:
    return {
        "check_in_modal": {
            "brand_name": "JUNGLE GYM",
            "action_name": "입실",
            "question_suffix": "하시겠습니까?",
            "confirm_label": "예, 입실하겠습니다.",
            "cancel_label": "아니요",
        },
        "check_out_modal": {
            "brand_name": "JUNGLE GYM",
            "action_name": "퇴실",
            "question_suffix": "하시겠습니까?",
            "confirm_label": "예, 퇴실하겠습니다.",
            "cancel_label": "아니요",
        },
        "workout_record": {
            "title_placeholder": "오늘의 운동을 한 줄로 남겨주세요.",
            "title_max_length": 100,
            "tags_label": "추천 태그",
            "tags": [
                {"id": "workout-tag-complete", "label": "#오운완", "highlighted": True},
                {"id": "workout-tag-upper", "label": "#상체", "highlighted": False},
                {"id": "workout-tag-lower", "label": "#하체", "highlighted": False},
                {"id": "workout-tag-cardio", "label": "#유산소", "highlighted": False},
                {"id": "workout-tag-stretch", "label": "#스트레칭", "highlighted": False},
            ],
            "image_label": "오운완 이미지",
            "image_add_label": "오운완 사진 추가",
            "image_help_text": "선택 사항 · 최대 1장",
            "image_preview_alt": "선택한 오운완 이미지 미리보기",
            "image_remove_label": "사진 삭제",
            "submit_label": "기록하고 퇴실하기",
            "cancel_label": "취소",
        },
    }


def build_dashboard_data() -> DashboardData:
    return {
        **build_common_data(is_login=True, user_name="정글러"),
        "page": {
            "browser_title": "메인",
            "breadcrumb": "메인",
            "title": "피트니스 센터",
            "home_url": "/",
        },
        "profile": {
            "section_label": "오운완 프로필",
            "title": "내 프로필",
            "name": "정글러",
            "email": "tiok0812@gmail.com",
            "profile_image_url": "",
            "badge_image": "image/icon/crown.png",
            "badge_alt": "오운완 왕관",
            "stats": [
                {
                    "value": 12,
                    "unit": "일",
                    "label": "이번 달 출석",
                    "highlight": True,
                },
                {
                    "value": 8,
                    "unit": "회",
                    "label": "오운완 기록",
                    "highlight": False,
                },
            ],
            "detail_url": "/mypage/info",
            "detail_label": "내 프로필 보기",
        },
        "recent_workout": {
            "section_label": "최근 오운완 기록",
            "title": "나의 변화를 확인해보세요.",
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSer-H1c8SaL4-xRRRxFRc7Z36YQYleQtSNpYTLaZ2EEw&s=10",
            "detail_url": "/",
        },
        "center_status": {
            "section_label": "피트니스 센터 현황",
            "current_prefix": "현재",
            "current_count": 18,
            "capacity": 50,
            "person_unit": "명",
            "status_message": "이 운동하고 있어 쾌적해요.",
            "occupancy_percent": 36,
            "detail_url": "/",
        },
        "attendance": {
            "title": "출석 체크 캘린더",
            "streak_count": 12,
            "streak_label": "일째 연속 오운완",
            "weekday_labels": ["일", "월", "화", "수", "목", "금", "토"],
            "calendar_days": [
                0, 0, 0, 0, 0, 1, 2,
                3, 4, 5, 6, 7, 8, 9,
                10, 11, 12, 13, 14, 15, 16,
                17, 18, 19, 20, 21, 22, 23,
                24, 25, 26, 27, 28, 29, 30,
                31, 0, 0, 0, 0, 0, 0,
            ],
            "attendance_days": [
                3, 5, 7, 10, 12, 14, 15, 16, 17,
                18, 19, 20, 21, 22, 23, 24, 25, 26,
            ],
            "streak_days": [
                15, 16, 17, 18, 19, 20,
                21, 22, 23, 24, 25, 26,
            ],
            "workout_events": {
                17: {"memo": "등 운동 완료", "has_photo": True},
                21: {"memo": "하체 운동 오운완", "has_photo": False},
                26: {"memo": "오늘도 운동 완료", "has_photo": True},
            },
            "legend": {
                "attendance": "출석",
                "streak": "연속 출석",
                "workout": "오운완 기록",
            },
        },
        "check_in_out": {
            "section_label": "입 · 퇴실",
            "title": "운동을 시작하거나 마쳐보세요.",
            "check_in": {
                "label": "입실",
                "description": "운동 시작",
            },
            "check_out": {
                "label": "퇴실",
                "description": "오운완 기록",
            },
            "detail_url": "/qr",
        },
        "weekly_visits": {
            "section_label": "요일별 방문 횟수",
            "title": "최근 방문 기록을 요일별로 비교해보세요.",
            "visits": [
                {"weekday": "월", "count": 14},
                {"weekday": "화", "count": 19},
                {"weekday": "수", "count": 24},
                {"weekday": "목", "count": 31},
                {"weekday": "금", "count": 46},
                {"weekday": "토", "count": 38},
                {"weekday": "일", "count": 17},
            ],
            "detail_url": "/",
        },
        "qr_components": build_qr_components_data(),
    }


def build_login_data() -> LoginViewData:
    return {
        **build_common_data(),
        "page": {
            "browser_title": "로그인 페이지",
            "heading": "로그인",
            "email": {
                "label": "이메일",
                "placeholder": "이메일을 입력해주세요.",
            },
            "password": {
                "label": "비밀번호",
                "placeholder": "비밀번호를 입력해주세요.",
            },
            "password_toggle_label": "비밀번호 표시 전환",
            "register_link": {"label": "회원가입", "url": "/register"},
            "submit_label": "로그인",
            "helper_links": [
                {"label": "비밀번호 찾기", "url": "/find-password"},
                {"label": "아이디 찾기", "url": "/find-id"},
            ],
            "helper_divider": "·",
        },
    }


def build_register_data() -> RegisterViewData:
    return {
        **build_common_data(),
        "page": {
            "browser_title": "회원가입 페이지",
            "heading": "회원가입",
            "email": {
                "label": "이메일",
                "placeholder": "이메일을 입력해주세요.",
            },
            "nickname": {
                "label": "닉네임",
                "placeholder": "@Nickname를 입력해주세요.",
            },
            "name": {
                "label": "이름",
                "placeholder": "이름을 입력해주세요.",
            },
            "password": {
                "label": "비밀번호",
                "placeholder": "비밀번호를 입력해주세요.",
            },
            "password_confirm": {
                "label": "비밀번호 확인",
                "placeholder": "비밀번호를 입력해주세요.",
            },
            "back_link": {"label": "돌아가기", "url": "/login"},
            "submit_label": "회원가입",
            "helper_links": [
                {"label": "비밀번호 찾기", "url": "/find-password"},
                {"label": "아이디 찾기", "url": "/find-id"},
            ],
            "helper_divider": "·",
        },
    }


def build_find_id_data() -> FindIdViewData:
    return {
        **build_common_data(),
        "page": {
            "browser_title": "아이디 찾기",
            "heading": "아이디 찾기",
            "verification": build_verification_copy(),
            "result_login_link": {"label": "로그인", "url": "/login"},
            "back_link": {"label": "로그인으로 돌아가기", "url": "/login"},
        },
    }


def build_find_password_data() -> FindPasswordViewData:
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


def build_qr_data() -> QRViewData:
    return {
        **build_common_data(is_login=True, user_name="정글러"),
        "page": {
            "browser_title": "입 · 퇴실",
            "back_link": {"label": "메인으로 가기", "url": "/"},
            "title": "입 · 퇴실",
            "check_in": {"label": "입실", "description": "운동 시작"},
            "check_out": {"label": "퇴실", "description": "오운완 기록"},
            "components": build_qr_components_data(),
        },
    }


def build_qr_result_data(*, is_success: bool) -> QRResultViewData:
    return {
        **build_common_data(is_login=True, user_name="정글러"),
        "page": {
            "browser_title": "입실 처리 결과",
            "back_link": {"label": "메인으로 가기", "url": "/"},
            "message_prefix": "입실 처리가 정상적으로 " if is_success else "입실 처리에 ",
            "message_highlight": "완료" if is_success else "실패",
            "message_suffix": "되었습니다." if is_success else "하였습니다.",
            "image_file": "image/icon/code-check.png" if is_success else "image/icon/fail.png",
            "image_alt": "입실 처리 완료" if is_success else "입실 처리 실패",
            "is_success": is_success,
        },
    }


def build_mypage_data(*, history: bool = False) -> MypageViewData:
    return {
        **build_common_data(is_login=True, user_name="정글러"),
        "page": {
            "browser_title": "활동 기록" if history else "내 프로필",
            "eyebrow": "마이페이지",
            "title": "활동 기록" if history else "내 프로필",
            "description": (
                "출석과 오운완 기록을 한눈에 확인해보세요."
                if history
                else "내 정보와 운동 기록을 확인해보세요."
            ),
            "user_name": "정글러",
            "email": "tiok0812@gmail.com",
            "profile_image_url": "",
            "stats": [
                {"value": 12, "unit": "일", "label": "이번 달 출석"},
                {"value": 8, "unit": "회", "label": "오운완 기록"},
            ],
            "primary_link": {
                "label": "내 프로필" if history else "활동 기록 보기",
                "url": "/mypage/info" if history else "/mypage/history",
            },
            "secondary_link": {"label": "메인으로 가기", "url": "/"},
        },
    }


@app.get("/")
def main():
    return render_template(
        "main/main.html",
        view_data=build_dashboard_data(),
    )

@app.get("/login")
def login():
    return render_template("auth/login.html", view_data=build_login_data())


@app.get("/register")
def register():
    return render_template("auth/register.html", view_data=build_register_data())


@app.get("/find-id")
def find_id():
    return render_template("auth/find-id.html", view_data=build_find_id_data())


@app.get("/find-password")
def find_password():
    return render_template(
        "auth/find-password.html",
        view_data=build_find_password_data(),
    )

@app.get("/qr")
def qr():
    return render_template("qr/qr.html", view_data=build_qr_data())


@app.get("/qr/success")
def qr_success():
    return render_template(
        "qr/sucess/qr_sucess.html",
        view_data=build_qr_result_data(is_success=True),
    )

@app.get("/qr/error")
def qr_error():
    return render_template(
        "qr/error/qr_error.html",
        view_data=build_qr_result_data(is_success=False),
    )


@app.get("/mypage/info")
def mypage_info():
    return render_template(
        "mypage/mypage.html",
        view_data=build_mypage_data(),
    )


@app.get("/mypage/history")
def mypage_history():
    return render_template(
        "mypage/mypage.html",
        view_data=build_mypage_data(history=True),
    )

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)
