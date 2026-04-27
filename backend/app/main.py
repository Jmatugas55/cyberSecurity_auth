from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .models import User
from .security import hash_password
from .routers import auth, login_attempts, password, departments, employees, profile

Base.metadata.create_all(bind=engine)


def ensure_default_admin() -> None:
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        if not admin:
            admin = User(
                email="admin@gmail.com",
                password=hash_password("admin123"),
                role="admin",
                reset_method="key",
                reset_key="AdminKey-001",
            )
            db.add(admin)
            db.commit()
            print("Default admin created: admin@gmail.com / admin123")
        elif admin.role != "admin":
            admin.role = "admin"
            db.commit()
    finally:
        db.close()


ensure_default_admin()

app = FastAPI(title="Secure FastAPI Auth System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(login_attempts.router)
app.include_router(password.router)
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(profile.router)


@app.get("/")
def home():
    return {"message": "Secure FastAPI Auth System"}
