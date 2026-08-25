from flask import request
from core.jwt import sign_validation, token_expired

PUBLIC_PATH ={
    "/login",
    "/auth/login",
    "/auth/logout",
    "/auth/refresh"
}

def auth_middleware():
    #공개 예외처리
    if request.path in PUBLIC_PATH:
        return 
    #access 토큰 서명, exp 검증
    access_token = request.cookies.get("access_token")
    if access_token == None:
        return {"success" : False, "state" : "token not found"}, 401
    if not sign_validation(access_token):
        return {"success" : False, "state" : "invalid token"}, 401
    if token_expired:
        return {"success" : False, "state" : "time out"}, 401

    return


