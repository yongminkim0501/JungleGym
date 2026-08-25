# user/forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField
from wtforms import validators


class RegisterForm(FlaskForm):
    nickname = StringField('닉네임', [
        validators.DataRequired(message='닉네임을 입력해주세요.'),
        validators.Length(min=4, max=25, message='4자 이상 25자 이하로 입력해주세요.'),
    ])
    name = StringField('이름', [
        validators.DataRequired(message='이름을 입력해주세요.'),
        validators.Length(max=50),
    ])
    email = StringField('이메일', [
        validators.DataRequired(message='이메일을 입력해주세요.'),
        validators.Email(message='올바른 이메일 형식이 아닙니다.'),
    ])
    password = PasswordField('비밀번호', [
        validators.DataRequired(message='비밀번호를 입력해주세요.'),
        validators.Length(min=8, message='8자 이상 입력해주세요.'),
    ])
    password_confirm = PasswordField('비밀번호 확인', [
        validators.DataRequired(message='비밀번호를 한 번 더 입력해주세요.'),
        validators.EqualTo('password', message='비밀번호가 일치하지 않습니다.'),
    ])