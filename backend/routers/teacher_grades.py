
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/grades",
    tags=["Giáo viên - Quản lý điểm"],
    dependencies=[Depends(require_roles("Giáo viên"))],
)


class GradeItem(BaseModel):
    ma_xep_lop: int = Field(gt=0)
    diem_tong_ket: Optional[Decimal] = Field(
        default=None, ge=0, le=10, decimal_places=2
    )


class GradeSave(BaseModel):
    records: list[GradeItem]


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
            404, "Không tìm thấy hồ sơ giáo viên"
        )

    return teacher_id


def check_class_access(db, class_id, teacher_id):
    row = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop,
                l.trang_thai,
                k.ten_khoa_hoc AS khoa_hoc
            FROM lop_hoc l
            JOIN khoa_hoc k
                ON k.ma_khoa_hoc = l.ma_khoa_hoc
            WHERE l.ma_lop = :class_id
              AND l.ma_giao_vien = :teacher_id
        """),
        {
            "class_id": class_id,
            "teacher_id": teacher_id,
        },
    ).mappings().first()

    if row is None:
        raise HTTPException(
            404, "Không tìm thấy lớp được phân công"
        )

    return row


@router.get("/classes")
def get_my_classes(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop,
                k.ten_khoa_hoc AS khoa_hoc,
                l.trang_thai
            FROM lop_hoc l
            JOIN khoa_hoc k
                ON k.ma_khoa_hoc = l.ma_khoa_hoc
            WHERE l.ma_giao_vien = :teacher_id
            ORDER BY l.ma_lop ASC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("/{class_id}")
def get_class_grades(
    class_id: int,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )
    class_info = check_class_access(
        db, class_id, teacher_id
    )

    rows = db.execute(
        text("""
            SELECT
                x.ma_xep_lop,
                x.ma_hoc_vien,
                h.ho_ten,
                d.diem_tong_ket
            FROM xep_lop x
            JOIN hoc_vien h
                ON h.ma_hoc_vien = x.ma_hoc_vien
            LEFT JOIN diem d
                ON d.ma_xep_lop = x.ma_xep_lop
            WHERE x.ma_lop = :class_id
              AND x.trang_thai IN (
                  'Đang học',
                  'Đã hoàn thành'
              )
            ORDER BY h.ma_hoc_vien ASC
        """),
        {"class_id": class_id},
    ).mappings().all()

    students = [
        {
            "ma_xep_lop": row["ma_xep_lop"],
            "ma_hoc_vien": row["ma_hoc_vien"],
            "ho_ten": row["ho_ten"],
            "diem_tong_ket": (
                float(row["diem_tong_ket"])
                if row["diem_tong_ket"] is not None
                else None
            ),
        }
        for row in rows
    ]

    return {
        "ma_lop": class_id,
        "ten_lop": class_info["ten_lop"],
        "khoa_hoc": class_info["khoa_hoc"],
        "trang_thai": class_info["trang_thai"],
        "items": students,
    }


@router.put("/{class_id}")
def save_class_grades(
    class_id: int,
    data: GradeSave,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )
    check_class_access(db, class_id, teacher_id)

    received_ids = [
        item.ma_xep_lop for item in data.records
    ]

    if len(received_ids) != len(set(received_ids)):
        raise HTTPException(
            400, "Danh sách có học viên bị trùng"
        )

    # Chỉ cho phép sửa điểm của học viên
    # thuộc lớp giáo viên được phân công.
    valid_rows = db.execute(
        text("""
            SELECT ma_xep_lop
            FROM xep_lop
            WHERE ma_lop = :class_id
              AND trang_thai IN (
                  'Đang học',
                  'Đã hoàn thành'
              )
        """),
        {"class_id": class_id},
    ).scalars().all()

    valid_ids = set(valid_rows)

    if not set(received_ids).issubset(valid_ids):
        raise HTTPException(
            400, "Có học viên không thuộc lớp này"
        )

    try:
        for item in data.records:
            if item.diem_tong_ket is None:
                db.execute(
                    text("""
                        DELETE FROM diem
                        WHERE ma_xep_lop = :id
                    """),
                    {"id": item.ma_xep_lop},
                )
            else:
                db.execute(
                    text("""
                        INSERT INTO diem (
                            ma_xep_lop,
                            diem_tong_ket
                        )
                        VALUES (:id, :score)
                        ON DUPLICATE KEY UPDATE
                            diem_tong_ket = VALUES(diem_tong_ket)
                    """),
                    {
                        "id": item.ma_xep_lop,
                        "score": item.diem_tong_ket,
                    },
                )

        db.commit()

        return {
            "message": "Lưu bảng điểm thành công",
            "updated": len(data.records),
        }

    except Exception:
        db.rollback()
        raise
