from flask import Blueprint, render_template, redirect, url_for, request, make_response, jsonify, g
from dependency_injector.wiring import inject, Provide

from domains.email.service import MailService
from domains.user.service import UserService
from core.core_schemas import RegisterRequest, LoginRequest, EmailVerificationRequest, EmailSendRequest, \
    RePasswordRequest
from ...containers import ApplicationContainers
from domains.user.errorhandler import EmailAlreadyExists, NicknameAlreadyExists
from core.jwt import make_Token
from core.security import verify_password, hash_password
from domains.dashboard.service import DashboardService

def build_dashboard_data(dashboard_service: DashboardService = Provide[ApplicationContainers.dashboard_service]) -> DashboardData:
    current_cnt = dashboard_service.get_current_cnt
    image_url =
    profile = dashboard_service.get_profile_exercise_image_title
    img_url = 
    data = dashboard_service.get_dashboard_data()
    


    return {
        **build_common_data(is_login=True, user_name="정글러"), # 세션
        data
    }
