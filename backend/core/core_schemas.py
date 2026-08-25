#### 빠른 개발을 위하여 스키마 관리 페이지 통합 -> 추후 리팩토링
from enum import Enum

from pydantic import BaseModel, Field, EmailStr

class RegisterRequest(BaseModel):
    nickname:str = Field(..., min_length= 4, max_length= 25,description= "4자 이상 25자 이하로")
    name:str = Field(..., max_length=50, description="")
    email: EmailStr
    password:str = Field(..., min_length=8, description="")

class RegisterResponse(BaseModel):
    pass

class Purpose(str, Enum):
    FIND_ID = "find_id"
    RESET_PW = "reset_pw"

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    purpose: Purpose

class EmailVerificationResponse(BaseModel):
    pass

class