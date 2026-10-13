
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/classes",
    tags=["Học viên - Lớp học của tôi"],
)


def get_student_id(db: Session, account_id: int):
    student_id = db.execute(
        text("""
            SELECT ma_hoc_vien
            FROM hoc_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {"account_id": account_id},
    ).scalar_one_or_none()

    if student_id is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ học viên",
        )

    return student_id


def serialize_value(value):
    if isinstance(value, (date, datetime, time)):
        return value.isoformat()

    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@router.get("")
def get_my_classes(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Học viên")
    ),
):
    student_id = get_student_id(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text("""
            SELECT
                xl.ma_xep_lop,
                l.ma_lop,
                l.ten_lop,
                kh.ten_khoa_hoc,

                COALESCE(
                    gv.ho_ten,
                    'Chưa phân công'
                ) AS giao_vien,

                l.ngay_bat_dau,
                l.ngay_ket_thuc,
                l.si_so_toi_da,
                l.trang_thai,
                xl.trang_thai AS trang_thai_xep_lop,

                (
                    SELECT COUNT(*)
                    FROM xep_lop xl2
                    WHERE xl2.ma_lop = l.ma_lop
                      AND xl2.trang_thai = 'Đang học'
                ) AS si_so

            FROM xep_lop xl

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            JOIN khoa_hoc kh
                ON kh.ma_khoa_hoc = l.ma_khoa_hoc

            LEFT JOIN giao_vien gv
                ON gv.ma_giao_vien = l.ma_giao_vien

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai <> 'Đã rời lớp'

            ORDER BY
                CASE l.trang_thai
                    WHEN 'Đang học' THEN 1
                    WHEN 'Sắp mở' THEN 2
                    WHEN 'Đã kết thúc' THEN 3
                    ELSE 4
                END,
                l.ma_lop DESC
        """),
        {"student_id": student_id},
    ).mappings().all()

    classes = [serialize_row(row) for row in rows]

    return {
        "stats": {
            "total_classes": len(classes),
            "active_classes": sum(
                1
                for item in classes
                if (
                    item["trang_thai"] == "Đang học"
                    and item["trang_thai_xep_lop"] == "Đang học"
                )
            ),
        },
        "classes": classes,
    }


@router.get("/{class_id}")
def get_class_detail(
    class_id: int,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Học viên")
    ),
):
    student_id = get_student_id(
        db, account.ma_tai_khoan
    )

    # Kiểm tra học viên có thuộc lớp này không.
    class_row = db.execute(
        text("""
            SELECT
                xl.ma_xep_lop,
                l.ma_lop,
                l.ten_lop,
                kh.ten_khoa_hoc,

                COALESCE(
                    gv.ho_ten,
                    'Chưa phân công'
                ) AS giao_vien,

                l.ngay_bat_dau,
                l.ngay_ket_thuc,
                l.si_so_toi_da,
                l.trang_thai,
                xl.trang_thai AS trang_thai_xep_lop,

                (
                    SELECT COUNT(*)
                    FROM xep_lop xl2
                    WHERE xl2.ma_lop = l.ma_lop
                      AND xl2.trang_thai = 'Đang học'
                ) AS si_so

            FROM xep_lop xl

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            JOIN khoa_hoc kh
                ON kh.ma_khoa_hoc = l.ma_khoa_hoc

            LEFT JOIN giao_vien gv
                ON gv.ma_giao_vien = l.ma_giao_vien

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.ma_lop = :class_id
              AND xl.trang_thai <> 'Đã rời lớp'
        """),
        {
            "student_id": student_id,
            "class_id": class_id,
        },
    ).mappings().first()

    if class_row is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lớp học của bạn",
        )

    # Lấy lịch học của lớp đã xác thực quyền.
    schedules = db.execute(
        text("""
            SELECT
                ma_lich,
                ma_lop,
                thu,
                gio_bat_dau,
                gio_ket_thuc,
                phong_hoc

            FROM lich_hoc

            WHERE ma_lop = :class_id

            ORDER BY
                FIELD(
                    thu,
                    'Thứ 2',
                    'Thứ 3',
                    'Thứ 4',
                    'Thứ 5',
                    'Thứ 6',
                    'Thứ 7',
                    'Chủ nhật'
                ),
                gio_bat_dau
        """),
        {"class_id": class_id},
    ).mappings().all()

    return {
        "class_info": serialize_row(class_row),
        "schedules": [
            serialize_row(row)
            for row in schedules
        ],
    }
