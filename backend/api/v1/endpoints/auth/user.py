from flask import Blueprint, render_template, redirect, url_for, request, make_response, jsonify, g
from dependency_injector.wiring import inject, Provide

from backend.domains.email.service import MailService
from backend.domains.user.service import UserService
from backend.core.core_schemas import RegisterRequest, LoginRequest, EmailVerificationRequest, EmailSendRequest, \
    RePasswordRequest
from ...containers import ApplicationContainers
from backend.domains.user.errorhandler import EmailAlreadyExists, NicknameAlreadyExists
from backend.core.jwt import make_Token
from backend.core.security import verify_password, hash_password
from backend.domains.dashboard.service import DashboardService
from frontend.view_data.auth import (
    build_login_data, build_register_data, build_find_password_data, build_common_data,build_find_id_data
                                     )


auth_bp = Blueprint('auth', __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods = ["POST"])
@inject
def register(
        user_service: UserService = Provide[ApplicationContainers.user_service]
):
    errors = {}
    body = RegisterRequest.model_validate(request.get_json())
    hashed_pw = hash_password(password = body.password)
    try:
        user_service.sign_up(
            email = body.email,
            nickname = body.nickname,
            name = body.name,
            password = hashed_pw
        )
        return redirect("/login")
    except EmailAlreadyExists:
        errors["email"] = ["이미 사용중인 이메일입니다."]
        pass
    except NicknameAlreadyExists:
        errors["nickname"] = ["이미 사용 중인 닉네임입니다."]
        pass

    return render_template('auth/register.html', view_data = build_register_data(), errors = errors)


# 만약 쓰인다면 마이페이지 쪽
@auth_bp.route("/profile-image", methods=["POST"])
@inject
def update_profile_image(
        user_service: UserService = Provide[ApplicationContainers.user_service],
):
    raw_data = request.get_json(silent=True)  # base64 데이터

    user_service.update_profile_image_by_user_id(user_id=g.user_id, profile_image_data=raw_data)

# 로그인
@auth_bp.route("/login", methods=["POST"])
@inject
def login(db = Provide[ApplicationContainers.db]):
    data = LoginRequest.model_validate(request.get_json())
    email = data.email
    password = data.password

    user = db.users.find_one({'email': email})
    if user is None:
        return jsonify({"success": False, "msg":"사용자가 없습니다."}), 401

    flag = verify_password(password = password, hashed_password=user["password"])

    if flag:
        jw_access_Token = make_Token(str(user["_id"]), "access")
        jw_refresh_Token = make_Token(str(user["_id"]), "refresh")

        response = redirect("/")
        response.set_cookie("access_token", jw_access_Token, httponly=True)
        response.set_cookie("refresh_token", jw_refresh_Token, httponly=True)
        return response

    return jsonify({
    "success": False,
    "msg": "비밀번호가 일치하지 않습니다."
}), 401

# 로그아웃
@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"success":True})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response # 실패할 경우 logout url이 잡히는 마이페이지로

@auth_bp.route("/send-code", methods = ["POST"])
@inject
def send_code(
    mail_service: MailService = Provide[ApplicationContainers.mail_service]
):
    data = EmailSendRequest.model_validate((request.get_json()))
    email = data.email

    mail_service.send_mail(email = email)
    return jsonify({"success": True}), 200

# 인증 코드 받아서 확인
@auth_bp.route("/verify-code", methods=["POST"])
@inject
def verify_code(
    mail_service: MailService = Provide[ApplicationContainers.mail_service]
):
    data = EmailVerificationRequest.model_validate((request.get_json()))
    email = data.email
    code = data.code
    mail_service.verify(email=email, code=code)
    return jsonify({"success": True}), 200

# 비밀 번호 업데이트
@auth_bp.route("/repassword", methods=["POST"])
def re_password(
        user_service: UserService = Provide[ApplicationContainers.user_service]
):
    data = RePasswordRequest.model_validate((request.get_json()))
    email = data.email
    password = data.password

    hashed_password = hash_password(password = password)
    user_service.update_pw_by_email(email=email, password=hashed_password)
    return jsonify({"success": True}), 200, redirect("/login")

# mainpage 
@auth_bp.route("/mainpage", methods = ["GET"])
@inject
def mainpage(db = Provide[ApplicationContainers.db]):

    user_id = g.user_id
   
    main_service_data = DashboardService(db).get_main_data(user_id)
    return render_template(
        "templates/dashboard.html",
        data = main_service_data
    )



    
    

    



