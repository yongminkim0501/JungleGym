from flask import Blueprint, render_template, redirect, url_for, flash
from dependency_injector.wiring import inject, Provide

from backend.domains.user.service import UserService
from backend.domains.user.schemas import RegisterForm
from ..containers import ApplicationContainers
from backend.domains.user.errorhandler import EmailAlreadyExists, NicknameAlreadyExists

user_bp = Blueprint('user', __name__, url_prefix="/api/user")

@user_bp.route("/register", methods = ["GET", "POST"])
@inject
def register(
        user_service: UserService = Provide[ApplicationContainers.user_service]
):
    form = RegisterForm()
    if form.validate_on_submit():
        try:
            user_service.sign_up(
                email = form.email.data,
                nickname = form.nickname.data,
                name = form.name.data,
                password = form.password.data
            )
        except EmailAlreadyExists:
            form.email.errors.append('이미 사용 중인 이메일입니다.')
        except NicknameAlreadyExists:
            form.nickname.errors.append('이미 사용 중인 닉네임입니다.')
        else:
            flash('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
            return redirect(url_for('user.login'))

    return render_template('register.html', form = form)