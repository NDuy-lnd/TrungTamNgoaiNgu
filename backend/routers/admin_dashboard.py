
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from security import require_roles


router = APIRouter(
    prefix="/api/admin/dashboard",
    tags=["Admin - Tổng quan"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)


@router.get("")
def get_admin_dashboard(db: Session = Depends(get_db)):
    stats = db.execute(
        text("""
            SELECT
                (SELECT COUNT(*) FROM hoc_vien) AS total_students,
                (SELECT COUNT(*) FROM giao_vien) AS total_teachers,
                (SELECT COUNT(*) FROM khoa_hoc) AS total_courses,
                (SELECT COUNT(*) FROM lop_hoc) AS total_classes
        """)
    ).mappings().one()

    classes = db.execute(
        text("""
            SELECT
                ma_lop AS `key`,
                ten_lop AS name,
                trang_thai AS status
            FROM lop_hoc
            ORDER BY
                CASE trang_thai
                    WHEN 'Đang học' THEN 1
                    WHEN 'Sắp mở' THEN 2
                    WHEN 'Đã kết thúc' THEN 3
                    ELSE 4
                END,
                ma_lop DESC
            LIMIT 5
        """)
    ).mappings().all()

    return {
        "stats": dict(stats),
        "classes": [dict(row) for row in classes],
    }
