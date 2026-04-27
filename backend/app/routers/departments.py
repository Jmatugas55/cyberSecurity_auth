from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import schemas
from ..models import Department
from ..jwt_auth import require_admin, get_current_user
from ..utils import get_db

router = APIRouter(prefix="/departments", tags=["departments"])


@router.post("", response_model=schemas.DepartmentOut)
def create_department(
    payload: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    name = (payload.department_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name cannot be empty")

    department = Department(department_name=name)
    db.add(department)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Department already exists")
    db.refresh(department)
    return department


@router.get("", response_model=List[schemas.DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return db.query(Department).order_by(Department.department_name.asc()).all()
