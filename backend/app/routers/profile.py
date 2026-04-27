from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import schemas
from ..models import Department, Employee, User
from ..jwt_auth import get_current_user
from ..security import hash_password, verify_password
from ..utils import get_db, validate_password

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_employee(db: Session, user: User) -> Employee:
    employee = (
        db.query(Employee)
        .options(joinedload(Employee.user), joinedload(Employee.department))
        .filter(Employee.user_id == user.id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


@router.get("", response_model=schemas.EmployeeOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_employee(db, current_user)


@router.put("", response_model=schemas.EmployeeOut)
def update_profile(
    payload: schemas.EmployeeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = _get_employee(db, current_user)
    for field in ("first_name", "last_name", "contact_number", "address"):
        value = getattr(payload, field)
        if value is not None:
            setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/password")
def update_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.old_password or not payload.new_password:
        raise HTTPException(status_code=400, detail="Old and new password are required")

    if not verify_password(payload.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    if payload.old_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from old password")

    new_pwd = payload.new_password
    if len(new_pwd.encode("utf-8")) > 72:
        new_pwd = new_pwd.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    validate_password(new_pwd)

    current_user.password = hash_password(new_pwd)
    db.commit()
    return {"message": "Password updated successfully"}


@router.put("/department", response_model=schemas.EmployeeOut)
def update_department(
    payload: schemas.DepartmentChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    department = db.query(Department).filter(Department.department_id == payload.department_id).first()
    if not department:
        raise HTTPException(status_code=400, detail="Department not found")

    employee = _get_employee(db, current_user)
    employee.department_id = department.department_id
    db.commit()
    db.refresh(employee)
    return employee
