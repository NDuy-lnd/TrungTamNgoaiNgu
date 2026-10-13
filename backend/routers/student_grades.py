
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/grades",
    tags=["Học viên - Kết quả học tập"],
)


@router.get("")
def get_student_grades(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Học viên")),
):
    # Xác định học viên từ tài khoản đăng nhập
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

    # Lấy tất cả lớp học viên tham gia,
    # kể cả lớp chưa được giáo viên nhập điểm.
    rows = db.execute(
        text("""
            SELECT
                xl.ma_xep_lop,
                l.ma_lop,
                l.ten_lop,
                kh.ten_khoa_hoc,
                l.trang_thai AS trang_thai_lop,
                xl.trang_thai AS trang_thai_xep_lop,
                d.ma_diem,
                d.diem_tong_ket

            FROM xep_lop xl

            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop

            JOIN khoa_hoc kh
                ON kh.ma_khoa_hoc = l.ma_khoa_hoc

            LEFT JOIN diem d
                ON d.ma_xep_lop = xl.ma_xep_lop

            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai <> 'Đã rời lớp'

            ORDER BY
                l.ma_lop DESC
        """),
        {"student_id": student_id},
    ).mappings().all()

    grades = []

    for row in rows:
        item = dict(row)

        if item["diem_tong_ket"] is not None:
            item["diem_tong_ket"] = float(
                item["diem_tong_ket"]
            )

        grades.append(item)

    # Chỉ tính điểm trung bình trên những lớp đã có điểm.
    scored = [
        item["diem_tong_ket"]
        for item in grades
        if item["diem_tong_ket"] is not None
    ]

    total_classes = len(grades)
    graded_classes = len(scored)

    passed_classes = sum(
        1 for score in scored if score >= 5
    )

    average_score = (
        round(sum(scored) / graded_classes, 2)
        if graded_classes > 0
        else None
    )

    progress_percent = (
        round(graded_classes / total_classes * 100)
        if total_classes > 0
        else 0
    )

    return {
        "stats": {
            "total_classes": total_classes,
            "graded_classes": graded_classes,
            "average_score": average_score,
            "passed_classes": passed_classes,
            "progress_percent": progress_percent,
        },
        "grades": grades,
    }
