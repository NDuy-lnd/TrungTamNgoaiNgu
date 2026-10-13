
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/schedule",
    tags=["Học viên - Lịch học"],
)


@router.get("")
def get_student_schedule(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Học viên")),
):
    # Xác định học viên đang đăng nhập từ JWT
    student_id = db.execute(
        text("""
            SELECT ma_hoc_vien
            FROM hoc_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {"account_id": account.ma_tai_khoan},
    ).scalar_one_or_none()

    if student_id is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ học viên",
        )

    # Danh sách lớp học viên đang tham gia
    classes = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop,
                l.trang_thai

            FROM xep_lop xl

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai = 'Đang học'
              AND l.trang_thai = 'Đang học'

            ORDER BY l.ten_lop
        """),
        {"student_id": student_id},
    ).mappings().all()

    # Lịch học cố định hàng tuần
    schedules = db.execute(
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

            JOIN xep_lop xl
                ON xl.ma_lop = l.ma_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai = 'Đang học'
              AND l.trang_thai = 'Đang học'

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
                lh.gio_bat_dau,
                l.ten_lop
        """),
        {"student_id": student_id},
    ).mappings().all()

    result_schedules = []

    for row in schedules:
        item = dict(row)

        # MySQL TIME có thể trả về timedelta.
        # Chuẩn hóa về HH:MM cho Frontend.
        item["gio_bat_dau"] = (
            str(item["gio_bat_dau"])[:5]
        )
        item["gio_ket_thuc"] = (
            str(item["gio_ket_thuc"])[:5]
        )

        result_schedules.append(item)

    return {
        "classes": [dict(row) for row in classes],
        "schedules": result_schedules,
    }
