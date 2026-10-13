
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/dashboard",
    tags=["Giáo viên - Tổng quan"],
)


@router.get("")
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    # Xác định giáo viên từ tài khoản đăng nhập
    teacher = db.execute(
        text("""
            SELECT ma_giao_vien
            FROM giao_vien
            WHERE ma_tai_khoan = :account_id
        """),
        {"account_id": account.ma_tai_khoan},
    ).mappings().first()

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thông tin giáo viên",
        )

    teacher_id = teacher["ma_giao_vien"]

    # Thống kê số lớp và số học viên
    stats = db.execute(
        text("""
            SELECT
                (
                    SELECT COUNT(*)
                    FROM lop_hoc
                    WHERE ma_giao_vien = :teacher_id
                ) AS total_classes,

                (
                    SELECT COUNT(DISTINCT xl.ma_hoc_vien)
                    FROM xep_lop xl
                    JOIN lop_hoc l
                        ON xl.ma_lop = l.ma_lop
                    WHERE l.ma_giao_vien = :teacher_id
                      AND xl.trang_thai = 'Đang học'
                ) AS total_students,

                (
                    SELECT COUNT(*)
                    FROM lich_hoc lh
                    JOIN lop_hoc l
                        ON lh.ma_lop = l.ma_lop
                    WHERE l.ma_giao_vien = :teacher_id
                      AND l.trang_thai = 'Đang học'
                ) AS weekly_sessions,

                (
                    SELECT COUNT(*)
                    FROM lop_hoc
                    WHERE ma_giao_vien = :teacher_id
                      AND trang_thai = 'Đang học'
                ) AS active_classes
        """),
        {"teacher_id": teacher_id},
    ).mappings().one()

    # Danh sách lớp giáo viên phụ trách
    classes = db.execute(
        text("""
            SELECT
                l.ma_lop AS id,
                l.ten_lop AS name,
                kh.ten_khoa_hoc AS course,

                (
                    SELECT COUNT(*)
                    FROM xep_lop xl
                    WHERE xl.ma_lop = l.ma_lop
                      AND xl.trang_thai = 'Đang học'
                ) AS students,

                l.trang_thai AS status

            FROM lop_hoc l
            JOIN khoa_hoc kh
                ON l.ma_khoa_hoc = kh.ma_khoa_hoc

            WHERE l.ma_giao_vien = :teacher_id

            ORDER BY
                CASE l.trang_thai
                    WHEN 'Đang học' THEN 1
                    WHEN 'Sắp mở' THEN 2
                    WHEN 'Đã kết thúc' THEN 3
                    ELSE 4
                END,
                l.ma_lop DESC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    # Lấy lịch học từng lớp
    schedules = db.execute(
        text("""
            SELECT
                lh.ma_lop,
                lh.thu,
                lh.gio_bat_dau,
                lh.gio_ket_thuc
            FROM lich_hoc lh
            JOIN lop_hoc l
                ON lh.ma_lop = l.ma_lop
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
                lh.gio_bat_dau
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    schedule_by_class = {}

    for item in schedules:
        class_id = item["ma_lop"]

        start_time = str(item["gio_bat_dau"])[:5]
        end_time = str(item["gio_ket_thuc"])[:5]

        schedule_text = (
            f"{item['thu']} "
            f"{start_time}-{end_time}"
        )

        schedule_by_class.setdefault(
            class_id, []
        ).append(schedule_text)

    result_classes = []

    for item in classes:
        row = dict(item)

        row["schedule"] = ", ".join(
            schedule_by_class.get(
                row["id"], []
            )
        ) or "Chưa có lịch học"

        result_classes.append(row)

    return {
        "stats": dict(stats),
        "classes": result_classes,
    }
