from typing import Optional
from pydantic import BaseModel, EmailStr, root_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    reset_method: str = "key"
    reset_key: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None

    @root_validator(skip_on_failure=True)
    def validate_reset_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")

        if method not in ("key", "question"):
            raise ValueError("reset_method must be 'key' or 'question'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if not question or not question.strip():
                raise ValueError("security question cannot be empty")
            if not answer or len(answer.strip()) < 3:
                raise ValueError("security answer must be at least 3 characters")

        return values

    model_config = {"validate_assignment": True}


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    reset_method: str
    reset_key: Optional[str] = None
    security_question: Optional[str] = None
    security_answer: Optional[str] = None

    @root_validator(skip_on_failure=True)
    def validate_recovery_method(cls, values):
        method = values.get("reset_method")
        key = values.get("reset_key")
        question = values.get("security_question")
        answer = values.get("security_answer")

        if method not in ("key", "question"):
            raise ValueError("reset_method must be 'key' or 'question'")

        if method == "key":
            import re
            if not key or not re.fullmatch(r"[A-Za-z0-9_-]{6,32}", key):
                raise ValueError("reset key must be 6-32 characters and contain only letters, digits, hyphen or underscore")
        elif method == "question":
            if not question or not question.strip():
                raise ValueError("security question is required for security question method")
            if not answer or len(answer.strip()) < 3:
                raise ValueError("security answer must be at least 3 characters")

        return values


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


class DepartmentCreate(BaseModel):
    department_name: str


class DepartmentOut(BaseModel):
    department_id: int
    department_name: str

    model_config = {"from_attributes": True}


class EmployeeUserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class EmployeeOut(BaseModel):
    employee_id: int
    user_id: int
    department_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    user: Optional[EmployeeUserOut] = None
    department: Optional[DepartmentOut] = None

    model_config = {"from_attributes": True}


class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    reset_method: str = "key"
    reset_key: Optional[str] = "TempKey-1234"


class EmployeeProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None


class DepartmentChange(BaseModel):
    department_id: int


class PasswordChange(BaseModel):
    old_password: str
    new_password: str
