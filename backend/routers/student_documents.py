
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/documents",
    tags=["Học viên - Tài liệu học tập"],
)


@router.get("")
def get_student_documents(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Học viên")
    ),
):
    # 1. Xác định học viên đang đăng nhập
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

    # 2. Danh sách lớp học viên đang tham gia
    classes = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop

            FROM xep_lop xl

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai = 'Đang học'
              AND l.trang_thai = 'Đang học'

            ORDER BY l.ten_lop
        """),
        {
            "student_id": student_id
        },
    ).mappings().all()

    # 3. Tài liệu của những lớp học viên đang tham gia
    documents = db.execute(
        text("""
            SELECT
                tl.ma_tai_lieu,
                tl.ma_lop,
                l.ten_lop,
                tl.ten_tai_lieu,
                tl.duong_dan_file,
                tl.ngay_dang,
                tl.mo_ta

            FROM tai_lieu tl

            JOIN lop_hoc l
                ON l.ma_lop = tl.ma_lop

            JOIN xep_lop xl
                ON xl.ma_lop = l.ma_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai = 'Đang học'
              AND l.trang_thai = 'Đang học'

            ORDER BY
                tl.ngay_dang DESC,
                tl.ma_tai_lieu DESC
        """),
        {
            "student_id": student_id
        },
    ).mappings().all()

    result_documents = []

    for row in documents:
        item = dict(row)

        if item["ngay_dang"] is not None:
            item["ngay_dang"] = (
                item["ngay_dang"].isoformat()
            )

        result_documents.append(item)

    return {
        "classes": [
            dict(row) for row in classes
        ],
        "documents": result_documents,
    }
