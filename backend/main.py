
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from routers.auth import router as auth_router


from database import get_db, engine
from models import HocVien
from schemas import HocVienResponse

app = FastAPI(
    title="Language Center Management API",
    version="1.0.0",
    description="Backend quản lý trung tâm ngoại ngữ"
)
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {
        "message": "Language Center Management API"
    }

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected"
    }

@app.get("/api/database/tables")
def get_tables():
    inspector = inspect(engine)
    actual_tables = inspector.get_table_names()

    expected_tables = [
        "tai_khoan",
        "giao_vien",
        "hoc_vien",
        "khoa_hoc",
        "lop_hoc",
        "xep_lop",
        "lich_hoc",
        "diem_danh",
        "diem",
        "tai_lieu"
    ]

    return {
        "total_tables": len(actual_tables),
        "tables": actual_tables,
        "missing_tables": [
            table
            for table in expected_tables
            if table not in actual_tables
        ]
    }

@app.get(
    "/hoc-vien",
    response_model=list[HocVienResponse]
)
def get_hoc_vien(db: Session = Depends(get_db)):
    return db.query(HocVien).all()

from routers.hoc_vien import router as hoc_vien_router
app.include_router(hoc_vien_router)

from routers.giao_vien import router as giao_vien_router
app.include_router(giao_vien_router)

from routers.khoa_hoc import router as khoa_hoc_router
app.include_router(khoa_hoc_router)


from routers.lop_hoc import router as lop_hoc_router
app.include_router(lop_hoc_router)

from routers.lich_hoc import router as lich_hoc_router
app.include_router(lich_hoc_router)

from routers.thong_ke import router as thong_ke_router
app.include_router(thong_ke_router)

from routers.teacher_classes import router as teacher_classes_router
app.include_router(teacher_classes_router)

from routers.teacher_schedule import router as teacher_schedule_router
app.include_router(teacher_schedule_router)

from routers.teacher_attendance import router as teacher_attendance_router
app.include_router(teacher_attendance_router)

from routers.teacher_grades import router as teacher_grades_router
app.include_router(teacher_grades_router)

from routers.teacher_documents import router as teacher_documents_router
app.include_router(teacher_documents_router)

from routers.admin_dashboard import router as admin_dashboard_router
app.include_router(admin_dashboard_router)

from routers.teacher_dashboard import router as teacher_dashboard_router
app.include_router(teacher_dashboard_router)

from routers.student_dashboard import router as student_dashboard_router
app.include_router(student_dashboard_router)

from routers.student_classes import router as student_classes_router
app.include_router(student_classes_router)

from routers.student_schedule import router as student_schedule_router
app.include_router(student_schedule_router)

from routers.student_attendance import router as student_attendance_router
app.include_router(student_attendance_router)

from routers.student_grades import router as student_grades_router
app.include_router(student_grades_router)

from routers.student_documents import router as student_documents_router
app.include_router(student_documents_router)