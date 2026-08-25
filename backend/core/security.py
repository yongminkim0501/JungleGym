import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=[''])

def hash_password(password:str)->str:
    sha256_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    # str -> bytes -> 32바이트 -> 64글자 hex 문자열 변환 -> bcrypt로 salt + 느린 해싱
    # sha256로 또 한 번 더 하는 이유 : bcrypt는 72바이트 까지만 읽음
    # hexdigest 사용 이유 : 사람이 읽기 쉬움 / 단순 문자열 비교로 비교 가능
    result = pwd_context.hash(sha256_hash)
    return result

def verify_password(password: str, hashed_password: str) -> bool:
    sha256_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    #DB에 저장된 password와 로그인에서 사용할 password를 비교하여 검증
    return pwd_context.verify(sha256_hash, hashed_password)