from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..models import LoginAttempt, Employee
from .. import schemas, crud
from ..security import verify_password
from ..jwt_auth import create_access_token
from ..utils import get_db, validate_password

router = APIRouter()

MAX_ATTEMPTS = 5
BLOCK_MINUTES = 15


@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    raw_len = len(user.password.encode('utf-8')) if user.password else 0
    print(f"register attempt for {user.email}, pwd raw bytes={raw_len}")
    if not user.password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    if user.reset_method == "key":
        if not user.reset_key:
            raise HTTPException(status_code=400, detail="Reset key is required for reset_method 'key'.")
    elif user.reset_method == "question":
        if not user.security_question or not user.security_answer:
            raise HTTPException(status_code=400, detail="Security question and answer are required for reset_method 'question'.")
    else:
        raise HTTPException(status_code=400, detail="Invalid reset_method; expected 'key' or 'question'.")

    pwd = user.password
    if len(pwd.encode('utf-8')) > 72:
        trimmed = pwd.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        print(f"trimming password from {len(pwd.encode('utf-8'))} to {len(trimmed.encode('utf-8'))} bytes")
        pwd = trimmed

    validate_password(pwd)

    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        created = crud.create_user(
            db,
            user.email,
            pwd,
            reset_method=user.reset_method,
            reset_key=user.reset_key,
            security_question=user.security_question,
            security_answer=user.security_answer,
        )
    except ValueError as e:
        print(f"register error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as ex:
        print(f"register unexpected: {ex}")
        raise HTTPException(status_code=500, detail="Internal server error")

    created.role = "employee"

    employee = Employee(
        user_id=created.id,
        first_name=user.first_name,
        last_name=user.last_name,
        contact_number=user.contact_number,
        address=user.address,
    )
    db.add(employee)
    db.commit()
    db.refresh(created)
    return created


@router.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):

    db_user = crud.get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.blocked_until and db_user.blocked_until <= datetime.utcnow():
        db_user.blocked_until = None
        db.commit()

    if db_user.blocked_until and db_user.blocked_until > datetime.utcnow():
        raise HTTPException(
            status_code=403,
            detail="Account locked due to multiple failed attempts. Try again later."
        )

    ip = request.client.host

    if not verify_password(user.password, db_user.password):
        attempt = LoginAttempt(
            user_id=db_user.id,
            email=db_user.email,
            ip_address=ip,
            success=False
        )
        db.add(attempt)
        db.commit()

        attempts = db.query(LoginAttempt.id).filter(
            LoginAttempt.email == user.email,
            LoginAttempt.success == False
        ).count()

        remaining = MAX_ATTEMPTS - attempts

        if attempts >= MAX_ATTEMPTS:
            db_user.blocked_until = datetime.utcnow() + timedelta(minutes=BLOCK_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=403,
                detail=f"Too many failed attempts. Account locked for {BLOCK_MINUTES} minutes."
            )

        plural = "s" if remaining != 1 else ""
        raise HTTPException(
            status_code=401,
            detail=f"Invalid credentials. {remaining} attempt{plural} remaining."
        )

    db.query(LoginAttempt).filter(
        LoginAttempt.email == db_user.email,
        LoginAttempt.success == False
    ).delete()

    success_attempt = LoginAttempt(
        user_id=db_user.id,
        email=db_user.email,
        ip_address=ip,
        success=True
    )
    db.add(success_attempt)
    db_user.blocked_until = None
    db.commit()

    token = create_access_token({"sub": str(db_user.id), "role": db_user.role, "email": db_user.email})
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        role=db_user.role,
        user_id=db_user.id,
        email=db_user.email,
    )


@router.get("/security-question")
def get_security_question(email: EmailStr, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.reset_method != "question" or not user.security_question:
        raise HTTPException(status_code=400, detail="Security question is not available for this account")
    return {"security_question": user.security_question}
