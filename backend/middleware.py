from flask import request, redirect, url_for, g
from core.jwt import sign_validation, token_expired, decode_payload, make_Token


PUBLIC_PATH ={
    #"/login",
    "/auth/login",
    #"/auth/logout",
    "/static/js",
    "/static/css",
    "/register"
}

def auth_middleware():
    if request.path in PUBLIC_PATH:
        return

    access_token = request.cookies.get("access_token")

    if access_token is None:
        return redirect(url_for("auth.login"))

    if not sign_validation(access_token):
        return redirect(url_for("auth.login"))

    access_payload = decode_payload(access_token)

    if access_payload["type"] != "access":
        return redirect(url_for("auth.login"))

    if not token_expired(access_payload):
        g.user_id = access_payload["user_id"]
        return
    
    refresh_token = request.cookies.get("refresh_token")

    if refresh_token is None:
        return redirect(url_for("auth.login"))
    
    if not sign_validation(refresh_token):
        return redirect(url_for("auth.login"))

    refresh_payload = decode_payload(refresh_token)

    if refresh_payload["type"] != "refresh":
        return redirect(url_for("auth.login"))

    if token_expired(refresh_payload):
        return redirect(url_for("auth.login"))

    new_access_token = make_Token(
        refresh_payload["user_id"],
        "access"
    )
    g.new_access_token = new_access_token

    g.user_id = refresh_payload["user_id"]

