from flask import g
from dependency_injector.wiring import Provide, inject
from backend.api.v1.containers import ApplicationContainers

@inject
def get_current_user(user_service=Provide[ApplicationContainers.user_service]):
    if not g.is_login:
        return {
            ""
        }
    return user_service.get_user(user_id = g.user_id)