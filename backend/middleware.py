from flask import request, redirect, url_for, g

from backend.core.jwt import sign_validation, token_expired, decode_payload, make_Token

PUBLIC_PATH ={
    "/login",
    "/api/auth/login",
    "/api/auth/register",
    #"/auth/logout",
    "/register"
}

def auth_middleware():
    g.is_login = False
    if request.path in PUBLIC_PATH or request.path.startswith("/static/"):
        return

    access_token = request.cookies.get("access_token")

    if access_token is None:
        return redirect(url_for("login"))

    if not sign_validation(access_token):
        return redirect(url_for("login"))

    access_payload = decode_payload(access_token)

    if access_payload["type"] != "access":
        return redirect(url_for("login"))

    if not token_expired(access_payload):
        g.user_id = access_payload["user_id"]
        g.is_login = True
        return
    
    refresh_token = request.cookies.get("refresh_token")

    if refresh_token is None:
        return redirect(url_for("login"))
    
    if not sign_validation(refresh_token):
        return redirect(url_for("login"))

    refresh_payload = decode_payload(refresh_token)

    if refresh_payload["type"] != "refresh":
        return redirect(url_for("login"))

    if token_expired(refresh_payload):
        return redirect(url_for("login"))

    new_access_token = make_Token(
        refresh_payload["user_id"],
        "access"
    )
    g.new_access_token = new_access_token

    g.user_id = refresh_payload["user_id"]
    g.is_login = True

