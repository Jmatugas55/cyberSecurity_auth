from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from .. import schemas, crud
from ..security import verify_password
from ..utils import get_db, validate_password

router = APIRouter()


@router.post("/forgot-password")
def forgot_password(request_data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, request_data.email)
    if not user:
        return {"message": "If that email is registered, you will receive instructions."}

    if user.reset_method == "key":
        if not request_data.reset_key or request_data.reset_key != user.reset_key:
            print(f"forgot-password: reset key mismatch for {user.email}")
            raise HTTPException(status_code=400, detail="Reset key did not match")

    elif user.reset_method == "question":
        if not request_data.security_answer:
            raise HTTPException(status_code=400, detail="Security answer required")

        if not user.security_question:
            raise HTTPException(status_code=400, detail="Security question not set for this account")

        if request_data.security_question and request_data.security_question != user.security_question:
            raise HTTPException(status_code=400, detail="Security question did not match registered question")

        if not user.security_answer or not verify_password(request_data.security_answer, user.security_answer):
            print(f"forgot-password: security answer mismatch for {user.email}")
            raise HTTPException(status_code=400, detail="Security answer did not match")

    else:
        print(f"forgot-password: unknown reset method for {user.email}")
        raise HTTPException(status_code=400, detail="Invalid reset method")

    import secrets
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(minutes=15)

    crud.create_password_reset(db, user.id, token, expires)

    print(f"password reset token for {user.email}: {token}")

    return {"message": "Reset instructions sent", "token": token}


@router.post("/reset-password")
def reset_password(reset_data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, reset_data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or token")

    record = crud.get_password_reset_by_token(db, reset_data.token)
    if not record or record.user_id != user.id:
        raise HTTPException(status_code=400, detail="Invalid email or token")

    if record.expires_at < datetime.utcnow():
        crud.delete_password_reset(db, reset_data.token)
        raise HTTPException(status_code=400, detail="Token has expired")

    validate_password(reset_data.new_password)

    crud.update_user_password(db, user, reset_data.new_password)
    from ..models import LoginAttempt
    user.blocked_until = None
    db.query(LoginAttempt).filter(
        LoginAttempt.email == user.email,
        LoginAttempt.success == False
    ).delete()
    db.commit()

    crud.delete_password_reset(db, reset_data.token)

    return {"message": "Password has been reset"}