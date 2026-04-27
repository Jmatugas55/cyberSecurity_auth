from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import schemas, crud
from ..models import Department, Employee, User
from ..jwt_auth import create_access_token, require_admin
from ..utils import get_db, validate_password

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=schemas.EmployeeOut)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    pwd = payload.password or ""
    if len(pwd.encode("utf-8")) > 72:
        pwd = pwd.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    validate_password(pwd)

    if payload.department_id is not None:
        if not db.query(Department).filter(Department.department_id == payload.department_id).first():
            raise HTTPException(status_code=400, detail="Department not found")

    try:
        new_user = crud.create_user(
            db,
            email=payload.email,
            password=pwd,
            reset_method=payload.reset_method or "key",
            reset_key=payload.reset_key or "TempKey-1234",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    new_user.role = "employee"
    db.commit()

    employee = Employee(
        user_id=new_user.id,
        department_id=payload.department_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        contact_number=payload.contact_number,
        address=payload.address,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("", response_model=List[schemas.EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return (
        db.query(Employee)
        .options(joinedload(Employee.user), joinedload(Employee.department))
        .order_by(Employee.employee_id.desc())
        .all()
    )


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.id == employee.user_id).first()
    db.delete(employee)
    if user and user.role != "admin":
        db.delete(user)
    db.commit()
    return {"message": "Employee deleted"}


@router.post("/{employee_id}/impersonate", response_model=schemas.TokenResponse)
def impersonate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.id == employee.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Linked user not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot impersonate another admin")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
        "impersonated": True,
    })
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
    )
