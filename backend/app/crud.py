from sqlalchemy.orm import Session
from . import models
from .security import hash_password
from datetime import datetime

def create_user(
    db: Session,
    email: str,
    password: str,
    reset_method: str = "key",
    reset_key: str | None = None,
    security_question: str | None = None,
    security_answer: str | None = None,
):
    if not password:
        raise ValueError("Password cannot be empty")

    raw = password.encode("utf-8")
    if len(raw) > 72:
        password = raw[:72].decode("utf-8", errors="ignore")

    hashed_password = hash_password(password)

    if reset_method not in ("key", "question"):
        raise ValueError("reset_method must be 'key' or 'question'")

    if reset_method == "key":
        if not reset_key:
            raise ValueError("reset_key is required for reset_method 'key'")
        security_question = None
        security_answer = None

    if reset_method == "question":
        if not security_question or not security_answer:
            raise ValueError("security question and answer are required for reset_method 'question'")
        reset_key = None
        security_answer = hash_password(security_answer)

    user = models.User(
        email=email,
        password=hashed_password,
        reset_method=reset_method,
        reset_key=reset_key,
        security_question=security_question,
        security_answer=security_answer,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user_by_email(db: Session, email: str):
    
    return db.query(models.User).filter(models.User.email == email).first()


def create_password_reset(db: Session, user_id: int, token: str, expires_at: datetime):
    reset = models.PasswordReset(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset)
    db.commit()
    db.refresh(reset)
    return reset


def get_password_reset_by_token(db: Session, token: str):
    return db.query(models.PasswordReset).filter(models.PasswordReset.token == token).first()


def delete_password_reset(db: Session, token: str):
    db.query(models.PasswordReset).filter(models.PasswordReset.token == token).delete()
    db.commit()


def update_user_password(db: Session, user: models.User, new_password: str):
    raw = new_password.encode("utf-8")
    if len(raw) > 72:
        new_password = raw[:72].decode("utf-8", errors="ignore")
    user.password = hash_password(new_password)
    db.commit()
    return user