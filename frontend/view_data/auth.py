from ..view_data.common import build_common_data
from ..view_models.auth import (
    FindIdViewData,
    FindPasswordViewData,
    LoginViewData,
    RegisterViewData,
)


def build_login_data() -> LoginViewData:
    return build_common_data()


def build_register_data() -> RegisterViewData:
    return build_common_data()


def build_find_id_data() -> FindIdViewData:
    return build_common_data()


def build_find_password_data() -> FindPasswordViewData:
    return build_common_data()
