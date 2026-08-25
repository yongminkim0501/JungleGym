import json, base64, hashlib, hmac
import time
import os

key = os.getenv("JWT_KEY").encode("utf-8")


def jsontoBs64(data) -> bytes:
    en_base64 = strtobs64(json.dumps(data).encode("utf-8")).rstrip(b"=")
    return en_base64


def strtobs64(data) -> bytes:
    to_bytes = base64.urlsafe_b64encode(data)
    return to_bytes


def bs64toStr(data) -> str:
    data += b"=" * (-len(data) % 4)
    to_str = base64.urlsafe_b64decode(data)
    return to_str


def create_payload(user_id, type):
    min = 0  # expiration time
    if type == "access":
        min = 60
    elif type == "refresh":
        min = 7 * 60 * 24
    iat = int(time.time())
    exp = iat + (60 * min)
    payload = {
        "user_id": user_id,
        "iat": iat,
        "exp": exp,
        "type": type
    }
    return payload


def make_Token(user_id, type) -> bytes:
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    payload = create_payload(user_id, type)
    sign = base64.urlsafe_b64encode(
        hmac.new(key, jsontoBs64(header) + b"." + jsontoBs64(payload), hashlib.sha256).digest()).rstrip(b"=")

    token = jsontoBs64(header) + b"." + jsontoBs64(payload) + b"." + sign

    return token


def sign_validation(token) -> bool:
    header, payload, sign = token.split(b".")
    check_sign = base64.urlsafe_b64encode(hmac.new(key, header + b"." + payload, hashlib.sha256).digest()).rstrip(b"=")
    print(check_sign, sign)
    result = hmac.compare_digest(check_sign, sign)
    return result


def token_expired(token):
    if token["exp"] <= int(time.time()):
        return True


'''
# debug #

header = {
  "alg": "HS256",
  "typ": "JWT"
}
payload = create_payload("admin")

#토큰 생성
token = make_Token(header, payload)
#토큰 검증
print(sign_validation(token))
'''










