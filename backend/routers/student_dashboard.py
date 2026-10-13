
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/student/dashboard",
    tags=["Học viên - Tổng quan"],
)


@router.get("")
def get_student_dashboard(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Học viên")),
):
    # 1. Xác định học viên từ tài khoản đăng nhập
    student = db.execute(
        text("""
            SELECT ma_hoc_vien, ho_ten
            FROM hoc_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {"account_id": account.ma_tai_khoan},
    ).mappings().first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hồ sơ học viên",
        )

    student_id = student["ma_hoc_vien"]

    # 2. Thống kê tổng quan
    stats = db.execute(
        text("""
            SELECT
                (
                    SELECT COUNT(DISTINCT xl.ma_lop)
                    FROM xep_lop xl
                    JOIN lop_hoc l ON l.ma_lop = xl.ma_lop
                    WHERE xl.ma_hoc_vien = :student_id
                      AND xl.trang_thai = 'Đang học'
                      AND l.trang_thai = 'Đang học'
                ) AS active_classes,

                (
                    SELECT COUNT(*)
                    FROM lich_hoc lh
                    JOIN lop_hoc l ON l.ma_lop = lh.ma_lop
                    JOIN xep_lop xl ON xl.ma_lop = l.ma_lop
                    WHERE xl.ma_hoc_vien = :student_id
                      AND xl.trang_thai = 'Đang học'
                      AND l.trang_thai = 'Đang học'
                ) AS weekly_sessions,

                (
                    SELECT COUNT(*)
                    FROM diem_danh dd
                    JOIN xep_lop xl
                        ON xl.ma_xep_lop = dd.ma_xep_lop
                    WHERE xl.ma_hoc_vien = :student_id
                      AND dd.trang_thai = 'Có mặt'
                ) AS present_sessions,

                (
                    SELECT AVG(d.diem_tong_ket)
                    FROM diem d
                    JOIN xep_lop xl
                        ON xl.ma_xep_lop = d.ma_xep_lop
                    WHERE xl.ma_hoc_vien = :student_id
                      AND d.diem_tong_ket IS NOT NULL
                ) AS average_score
        """),
        {"student_id": student_id},
    ).mappings().one()

    # 3. Danh sách lớp học của học viên
    classes = db.execute(
        text("""
            SELECT
                xl.ma_xep_lop,
                l.ma_lop,
                l.ten_lop,
                kh.ten_khoa_hoc,
                COALESCE(gv.ho_ten, 'Chưa phân công') AS giao_vien,
                l.trang_thai,
                xl.trang_thai AS trang_thai_xep_lop
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

    # 4. Lịch học hàng tuần của các lớp đang học
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
                lh.gio_bat_dau
        """),
        {"student_id": student_id},
    ).mappings().all()

    # 5. Kết quả học tập
    grades = db.execute(
        text("""
            SELECT
                xl.ma_xep_lop,
                l.ma_lop,
                l.ten_lop,
                d.ma_diem,
                d.diem_tong_ket
            FROM xep_lop xl
            JOIN lop_hoc l
                ON l.ma_lop = xl.ma_lop
            LEFT JOIN diem d
                ON d.ma_xep_lop = xl.ma_xep_lop
            WHERE xl.ma_hoc_vien = :student_id
              AND xl.trang_thai <> 'Đã rời lớp'
            ORDER BY l.ma_lop DESC
        """),
        {"student_id": student_id},
    ).mappings().all()

    # Chuyển Decimal thành float để Frontend xử lý
    average_score = stats["average_score"]

    result_stats = {
        "active_classes": stats["active_classes"],
        "weekly_sessions": stats["weekly_sessions"],
        "present_sessions": stats["present_sessions"],
        "average_score": (
            round(float(average_score), 2)
            if average_score is not None
            else None
        ),
    }

    result_schedules = []

    for row in schedules:
        item = dict(row)
        item["gio_bat_dau"] = str(item["gio_bat_dau"])[:5]
        item["gio_ket_thuc"] = str(item["gio_ket_thuc"])[:5]
        result_schedules.append(item)

    result_grades = []

    for row in grades:
        item = dict(row)

        score = item["diem_tong_ket"]
        item["diem_tong_ket"] = (
            float(score) if score is not None else None
        )

        result_grades.append(item)

    return {
        "profile": {
            "ma_hoc_vien": student_id,
            "ho_ten": student["ho_ten"],
        },
        "stats": result_stats,
        "classes": [dict(row) for row in classes],
        "schedules": result_schedules,
        "grades": result_grades,
    }
