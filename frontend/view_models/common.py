from typing import TypedDict


class SessionData(TypedDict):
    status: bool
    is_login: bool
    user_name: str
    email: str
    profile_image_url: str


class BaseViewData(TypedDict):
    session: SessionData