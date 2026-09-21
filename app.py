import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, request, g

from frontend.view_data.auth import (
    build_find_id_data,
    build_find_password_data,
    build_login_data,
    build_register_data,
)
from frontend.view_data import dashboard as dashboard_view_data
from frontend.view_data.dashboard import build_dashboard_data
from frontend.view_data import mypage as mypage_view_data
from frontend.view_data.mypage import build_mypage_info_data, build_mypage_history_data
from frontend.view_data.qr import build_qr_data
from backend.api.v1.containers import ApplicationContainers
from backend.api.v1.endpoints.gym import check
from backend.api.v1.endpoints.gym.check import gym_bp
from backend.api.v1.endpoints.auth.user import auth_bp
from backend.api.v1.endpoints.auth import user
from backend.core import current_user
from backend.middleware import auth_middleware

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__,
template_folder=str(BASE_DIR / "frontend/templates"),
static_folder=str(BASE_DIR / "frontend/static"),)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-me')

app.before_request(auth_middleware)

@app.after_request
def apply_refreshed_token(response):
    new_access_token = getattr(g, "new_access_token", None)
    if new_access_token:
        response.set_cookie("access_token", new_access_token, httponly=True)
    return response

container = ApplicationContainers()
container.wire(modules=[user, check, dashboard_view_data, current_user, mypage_view_data])

app.container = container

db = container.db()
db.users.create_index('email', unique=True)
db.users.create_index('nickname', unique=True)

app.register_blueprint(auth_bp)
app.register_blueprint(gym_bp)

# frontend/templates/main/main.html

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
    action = request.args.get("type", "check-in")
    if action not in {"check-in", "check-out"}:
        action = "check-in"

    return render_template(
        "qr/sucess/qr_sucess.html",
        view_data=build_qr_data(),
        qr_action=action,
    )


@app.get("/qr/error")
def qr_error():
    action = request.args.get("type", "check-in")
    if action not in {"check-in", "check-out"}:
        action = "check-in"

    return render_template(
        "qr/error/qr_error.html",
        view_data=build_qr_data(),
        qr_action=action,
    )


@app.get("/mypage/info")
def mypage_info():
    return render_template(
        "mypage/info.html",
        view_data=build_mypage_info_data(),
    )


@app.get("/mypage/history")
def mypage_history():
    return render_template(
        "mypage/history.html",
        view_data=build_mypage_history_data(),
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
