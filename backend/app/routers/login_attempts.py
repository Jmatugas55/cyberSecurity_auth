from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from .. import database
from ..models import LoginAttempt

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/login-attempts")
def get_login_attempts(filter: str | None = Query(None, description="all, failed, success"),
                       db: Session = Depends(get_db)):
    agg = db.query(
        LoginAttempt.email,
        func.sum(case((LoginAttempt.success == True, 1), else_=0)).label("success_count"),
        func.sum(case((LoginAttempt.success == False, 1), else_=0)).label("failed_count"),
    ).group_by(LoginAttempt.email)

    if filter == "failed":
        agg = agg.having(func.sum(case((LoginAttempt.success == False, 1), else_=0)) > 0)
    elif filter == "success":
        agg = agg.having(func.sum(case((LoginAttempt.success == True, 1), else_=0)) > 0)

    result = []
    for row in agg:
        result.append({
            "email": row.email,
            "success": row.success_count,
            "failed": row.failed_count,
        })
    return result

@router.get("/blocked-users")
def get_blocked_users(db: Session = Depends(get_db)):
    """Return users whose account is currently locked due to failed logins."""
    from datetime import datetime
    from ..models import User
    now = datetime.utcnow()
    users = db.query(User).filter(User.blocked_until != None, User.blocked_until > now).all()
    return [
        {"id": u.id, "email": u.email, "blocked_until": u.blocked_until.isoformat()}
        for u in users
    ]

@router.post("/unblock-user/{user_id}")
def unblock_user(user_id: int, db: Session = Depends(get_db)):
    from ..models import User, LoginAttempt
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.blocked_until = None
    db.query(LoginAttempt).filter(LoginAttempt.email == user.email, LoginAttempt.success == False).delete()
    db.commit()
    return {"message": "User unblocked"}

@router.delete("/login-attempts/{attempt_id}")
def delete_login_attempt(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(LoginAttempt).filter(LoginAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    db.delete(attempt)
    db.commit()
    return {"message": "Login attempt deleted"}@router.post("/login-a   `ttempts/reset-failed/{email}")

@router.post("/login-attempts/reset-failed/{email}")
def reset_failed_attempts(email: str, db: Session = Depends(get_db)):
    db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False
    ).delete()
    from ..models import User
    db.query(User).filter(User.email == email).update({"blocked_until": None})
    db.commit()
    return {"message": "Failed attempts reset and user unlocked"}

@router.post("/login-attempts/reset-success/{email}")
def reset_success_attempts(email: str, db: Session = Depends(get_db)):
    db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == True
    ).delete()
    db.commit()
    return {"message": "Success attempts reset"}
