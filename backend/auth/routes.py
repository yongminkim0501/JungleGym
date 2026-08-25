from flask import Blueprint, request, make_response, jsonify
from pymongo import MongoClient
from core.jwt import make_Token, sign_validation, token_expired

auth_bp = Blueprint("auth", __name__)
client = MongoClient('localhost', 27017)
db = client.GYM

#로그인
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data["email"]
    password = data["password"]

    user = db.user.find_one({'email' : email})
    if user is None:
        return {"success" : False}
    
    if(password == user["password"]):
        jw_access_Token = make_Token(str(user["_id"]), "access")
        jw_refresh_Token = make_Token(str(user["_id"]), "refresh")

        response = make_response(
            jsonify({"success" : True})
        )
        response.set_cookie("access_token", jw_access_Token, httponly=True)
        response.set_cookie("refresh_token", jw_refresh_Token, httponly=True)
        

        return response
    
    return {"success" : False}

#로그아웃
@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(
        jsonify({"success" : True})
    )
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response

#리프레시
@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token == None:
        return {"success" : False, "state" : "token not found"}, 401
    if refresh_token["type"] != "refresh":
        return{"success": False, "state" : "not this token"}, 401
    if not sign_validation(refresh_token):
        return {"success" : False, "state" : "invalid token"}, 401
    if token_expired:
        return {"success" : False, "state" : "time out"}, 401

    return


