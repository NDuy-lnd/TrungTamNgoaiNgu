
from datetime import time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/schedule",
    tags=["Giáo viên - Lịch giảng dạy"],
    dependencies=[Depends(require_roles("Giáo viên"))],
)

WEEKDAYS = [
    "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5",
    "Thứ 6", "Thứ 7", "Chủ nhật",
]


def format_time(value):
    if isinstance(value, time):
        return value.strftime("%H:%M")

    if isinstance(value, timedelta):
        minutes = int(value.total_seconds() // 60)
        return f"{minutes // 60:02d}:{minutes % 60:02d}"

    return str(value)[:5]


def get_teacher_id(db, account_id):
    teacher_id = db.execute(
        text("""
            SELECT ma_giao_vien
            FROM giao_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {"account_id": account_id},
    ).scalar_one_or_none()

    if teacher_id is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ giáo viên",
        )

    return teacher_id


@router.get("")
def get_my_schedule(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Giáo viên")),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    # Chỉ lấy lịch thuộc lớp do giáo viên này phụ trách.
    rows = db.execute(
        text("""
            SELECT
                lh.ma_lich,
                lh.ma_lop,
                l.ten_lop,
                lh.thu,
                lh.gio_bat_dau,
                lh.gio_ket_thuc,
                lh.phong_hoc
            FROM lich_hoc lh
            JOIN lop_hoc l
                ON l.ma_lop = lh.ma_lop
            WHERE l.ma_giao_vien = :teacher_id
            ORDER BY
                FIELD(
                    lh.thu,
                    'Thứ 2',
                    'Thứ 3',
                    'Thứ 4',
                    'Thứ 5',
                    'Thứ 6',
                    'Thứ 7',
                    'Chủ nhật'
                ),
                lh.gio_bat_dau ASC,
                lh.ma_lich ASC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    schedules = [
        {
            "id": row["ma_lich"],
            "ma_lop": row["ma_lop"],
            "ten_lop": row["ten_lop"],
            "thu": row["thu"],
            "gio_bat_dau": format_time(
                row["gio_bat_dau"]
            ),
            "gio_ket_thuc": format_time(
                row["gio_ket_thuc"]
            ),
            "phong_hoc": row["phong_hoc"],
        }
        for row in rows
    ]

    # Chỉ đưa các lớp có lịch vào bộ lọc,
    # giống cách thống kê của giao diện gốc.
    class_options = []
    seen_classes = set()

    for item in schedules:
        if item["ma_lop"] not in seen_classes:
            seen_classes.add(item["ma_lop"])
            class_options.append({
                "value": item["ma_lop"],
                "label": item["ten_lop"],
            })

    return {
        "items": schedules,
        "classes": class_options,
    }
