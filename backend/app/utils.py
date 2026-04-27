import re
import base64
from fastapi import HTTPException
from .database import SessionLocal
from sqlalchemy.orm import Session


def clean_b64(data_url: str) -> str:

    if "," in data_url and data_url.startswith("data:"):
        body = data_url.split(",", 1)[1]
    else:
        body = data_url
    body = re.sub(r"\s+", "", body)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    pad = (-len(body)) % 4
    if pad:
        body += "=" * pad
    return body


def get_db():

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def validate_password(password: str):
    """Raise HTTPException if the password doesn't meet policy."""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")


def repair_b64(data_url: str) -> str:
    prefix = ""
    if "," in data_url and data_url.startswith("data:"):
        prefix = data_url.split(",", 1)[0] + ","

    body = clean_b64(data_url)

    def _try_decode(s: str) -> bool:
        try:
            base64.b64decode(s, validate=True)
            return True
        except Exception:
            return False

    if _try_decode(body):
        return prefix + body

    for extra in range(1, 3):
        candidate = body + ("=" * extra)
        if _try_decode(candidate):
            return prefix + candidate

    candidate = body
    while len(candidate) >= 4:
        candidate = candidate[:-1]
        if _try_decode(candidate):
            pad = (-len(candidate)) % 4
            if pad:
                candidate += "=" * pad
            return prefix + candidate

    raise ValueError("cannot repair base64 payload")