
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/attendance",
    tags=["Học viên - Lịch sử điểm danh"],
)


@router.get("")
def get_student_attendance(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Học viên")
    ),
):
    # Xác định học viên từ tài khoản đăng nhập
    student_id = db.execute(
        text("""
            SELECT ma_hoc_vien
            FROM hoc_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {
            "account_id": account.ma_tai_khoan
        },
    ).scalar_one_or_none()

    if student_id is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ học viên",
        )

    # Danh sách lớp học viên đã hoặc đang tham gia
    # Không hiển thị lớp đã rời.
    classes = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop
            FROM xep_lop xl
            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop
            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai <> 'Đã rời lớp'
            ORDER BY l.ten_lop
        """),
        {
            "student_id": student_id
        },
    ).mappings().all()

    # Lấy các bản ghi điểm danh của học viên
    records = db.execute(
        text("""
            SELECT
                dd.ma_diem_danh,
                dd.ma_xep_lop,
                xl.ma_lop,
                l.ten_lop,
                dd.ngay_hoc,
                dd.trang_thai,
                dd.ghi_chu

            FROM diem_danh dd

            JOIN xep_lop xl
                ON xl.ma_xep_lop = dd.ma_xep_lop

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai <> 'Đã rời lớp'

            ORDER BY
                dd.ngay_hoc DESC,
                dd.ma_diem_danh DESC
        """),
        {
            "student_id": student_id
        },
    ).mappings().all()

    result_records = []

    for row in records:
        item = dict(row)

        item["ngay_hoc"] = (
            item["ngay_hoc"].isoformat()
            if item["ngay_hoc"] is not None
            else None
        )

        result_records.append(item)

    return {
        "classes": [
            dict(row) for row in classes
        ],
        "records": result_records,
    }
