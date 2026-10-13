
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/attendance",
    tags=["Giáo viên - Điểm danh"],
    dependencies=[Depends(require_roles("Giáo viên"))],
)


class AttendanceItem(BaseModel):
    ma_xep_lop: int = Field(gt=0)
    trang_thai: Literal["Có mặt", "Vắng mặt"]
    ghi_chu: Optional[str] = Field(default=None, max_length=255)


class AttendanceSave(BaseModel):
    ngay_hoc: date
    records: list[AttendanceItem]


def teacher_id_from_account(db, account_id):
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
            404, "Không tìm thấy hồ sơ giáo viên"
        )

    return teacher_id


def check_class_access(db, class_id, teacher_id):
    row = db.execute(
        text("""
            SELECT ma_lop, ten_lop, ngay_bat_dau,
                   ngay_ket_thuc, trang_thai
            FROM lop_hoc
            WHERE ma_lop = :class_id
              AND ma_giao_vien = :teacher_id
        """),
        {
            "class_id": class_id,
            "teacher_id": teacher_id,
        },
    ).mappings().first()

    if not row:
        raise HTTPException(
            404, "Không tìm thấy lớp được phân công"
        )

    return row


def get_students(db, class_id):
    rows = db.execute(
        text("""
            SELECT
                x.ma_xep_lop,
                x.ma_hoc_vien,
                h.ho_ten
            FROM xep_lop x
            JOIN hoc_vien h
                ON h.ma_hoc_vien = x.ma_hoc_vien
            WHERE x.ma_lop = :class_id
              AND x.trang_thai = 'Đang học'
            ORDER BY h.ma_hoc_vien ASC
        """),
        {"class_id": class_id},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("/classes")
def my_attendance_classes(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = teacher_id_from_account(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text("""
            SELECT ma_lop, ten_lop, trang_thai
            FROM lop_hoc
            WHERE ma_giao_vien = :teacher_id
            ORDER BY ma_lop ASC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("/{class_id}")
def get_attendance(
    class_id: int,
    ngay_hoc: date,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = teacher_id_from_account(
        db, account.ma_tai_khoan
    )
    class_info = check_class_access(
        db, class_id, teacher_id
    )

    students = get_students(db, class_id)

    records = db.execute(
        text("""
            SELECT
                d.ma_xep_lop,
                d.trang_thai,
                d.ghi_chu
            FROM diem_danh d
            JOIN xep_lop x
                ON x.ma_xep_lop = d.ma_xep_lop
            WHERE x.ma_lop = :class_id
              AND x.trang_thai = 'Đang học'
              AND d.ngay_hoc = :ngay_hoc
        """),
        {
            "class_id": class_id,
            "ngay_hoc": ngay_hoc,
        },
    ).mappings().all()

    saved = {
        row["ma_xep_lop"]: dict(row)
        for row in records
    }

    items = [
        {
            **student,
            "trang_thai": saved.get(
                student["ma_xep_lop"], {}
            ).get("trang_thai"),
            "ghi_chu": saved.get(
                student["ma_xep_lop"], {}
            ).get("ghi_chu") or "",
        }
        for student in students
    ]

    return {
        "ma_lop": class_id,
        "ten_lop": class_info["ten_lop"],
        "ngay_hoc": ngay_hoc.isoformat(),
        "is_saved": bool(records),
        "items": items,
    }


@router.put("/{class_id}")
def save_attendance(
    class_id: int,
    data: AttendanceSave,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = teacher_id_from_account(
        db, account.ma_tai_khoan
    )

    class_info = check_class_access(
        db, class_id, teacher_id
    )

    if data.ngay_hoc > date.today():
        raise HTTPException(
            400, "Không thể điểm danh ngày trong tương lai"
        )

    if (
        data.ngay_hoc < class_info["ngay_bat_dau"]
        or data.ngay_hoc > class_info["ngay_ket_thuc"]
    ):
        raise HTTPException(
            400, "Ngày điểm danh nằm ngoài thời gian lớp học"
        )

    students = get_students(db, class_id)

    valid_ids = {
        student["ma_xep_lop"]
        for student in students
    }

    received_ids = [
        item.ma_xep_lop
        for item in data.records
    ]

    if len(received_ids) != len(set(received_ids)):
        raise HTTPException(
            400, "Danh sách điểm danh bị trùng học viên"
        )

    if set(received_ids) != valid_ids:
        raise HTTPException(
            400,
            "Phải điểm danh đầy đủ học viên đang học trong lớp"
        )

    try:
        for item in data.records:
            db.execute(
                text("""
                    INSERT INTO diem_danh (
                        ma_xep_lop,
                        ngay_hoc,
                        trang_thai,
                        ghi_chu
                    )
                    VALUES (
                        :ma_xep_lop,
                        :ngay_hoc,
                        :trang_thai,
                        :ghi_chu
                    )
                    ON DUPLICATE KEY UPDATE
                        trang_thai = VALUES(trang_thai),
                        ghi_chu = VALUES(ghi_chu)
                """),
                {
                    "ma_xep_lop": item.ma_xep_lop,
                    "ngay_hoc": data.ngay_hoc,
                    "trang_thai": item.trang_thai,
                    "ghi_chu": item.ghi_chu,
                },
            )

        db.commit()

        return {
            "message": "Lưu điểm danh thành công",
            "total": len(data.records),
        }

    except Exception:
        db.rollback()
        raise
