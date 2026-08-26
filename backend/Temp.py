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


