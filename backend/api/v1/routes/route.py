from flask import Blueprint, render_template

from api.v1.endpoints.build.build_page import build_find_password_data, build_register_data, build_login_data, build_qr_data

page_bp = Blueprint('page',__name__)
@page_bp.get("/login")
def login():
    return render_template("auth/login.html", view_data=build_login_data())


@page_bp.get("/register")
def register():
    return render_template("auth/register.html", view_data=build_register_data())


@page_bp.get("/find-password")
def find_password():
    return render_template(
        "auth/find-password.html",
        view_data=build_find_password_data(),
    )

@page_bp.get("/qr")
def qr():
    return render_template("qr/qr.html", view_data=build_qr_data())