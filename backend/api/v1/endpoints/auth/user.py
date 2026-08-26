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
from domains.main.service import MainService
 
auth_bp = Blueprint('auth', __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods = ["POST"])
@inject
def register(
        user_service: UserService = Provide[ApplicationContainers.user_service]
):
    for_render_data = request.form.to_dict()
    errors = {}
    body = RegisterRequest.model_validate(request.get_json())
    values = request.form_to_dict()
    hashed_pw = hash_password(password = body.password)
    try:
        user_service.sign_up(
            email = body.email,
            nickname = body.nickname,
            name = body.name,
            password = hashed_pw
        )
    except EmailAlreadyExists:
        #form.email.errors.append('이미 사용 중인 이메일입니다.')
        errors["email"] = ["이미 사용중인 이메일입니다."]
        pass
    except NicknameAlreadyExists:
        #form.nickname.errors.append('이미 사용 중인 닉네임입니다.')
        errors["nickname"] = ["이미 사용 중인 닉네임입니다."]
        pass
    else:
        return redirect(url_for('user.login'))
    # form에 데이터 연결 해야 함
    return render_template('register.html', values = for_render_data, errors = errors)

@auth_bp.route("/profile-image")
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
        return {"success": False}

    flag = verify_password(password = password, hashed_password=user["password"])

    if flag:
        jw_access_Token = make_Token(str(user["_id"]), "access")
        jw_refresh_Token = make_Token(str(user["_id"]), "refresh")

        response = make_response(
            jsonify({"success": True})
        )

        response.set_cookie("access_token", jw_access_Token, httponly=True)
        response.set_cookie("refresh_token", jw_refresh_Token, httponly=True)

        return response

    return {"success": False}


# 로그아웃
@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(
        jsonify({"success": True})
    )
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response

# 이메일 기반 코드 전송, 인증 코드 받아서 확인 해주는 엔드포인트 하나, 비밀 번호 업데이트

# 이메일 기반 코드 전송
@auth_bp.route("/send-code", methods = ["POST"])
@inject
def send_code(
    mail_service: MailService = Provide[ApplicationContainers.mail_service]
):
    data = EmailSendRequest.model_validate((request.get_json()))
    email = data.email
    return mail_service.send_mail(email = email)

# 인증 코드 받아서 확인
@auth_bp.route("/verify-code")
@inject
def verify_code(
    mail_service: MailService = Provide[ApplicationContainers.mail_service]
):
    data = EmailVerificationRequest.model_validate((request.get_json()))
    email = data.email
    code = data.code

    return mail_service.verify(email=email, code=code)

# 비밀 번호 업데이트
@auth_bp.route("")

# mainpage 
@auth_bp.route("/mainpage", methods = ["GET"])
@inject
def mainpage(db = Provide[ApplicationContainers.db]):

    user_id = g.user_id
   
    main_service_data = MainService(db).get_main_data(user_id)
    return render_template(
        "templates/main.html",
        data = main_service_data
    )



    
    

    



