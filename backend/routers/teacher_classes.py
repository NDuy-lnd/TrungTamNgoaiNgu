
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/classes",
    tags=["Giáo viên - Lớp của tôi"],
    dependencies=[Depends(require_roles("Giáo viên"))],
)


def get_teacher_id(db: Session, account_id: int):
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


def serialize_class(row):
    result = dict(row)

    for field in ("ngay_bat_dau", "ngay_ket_thuc"):
        value = result.get(field)
        if value is not None:
            result[field] = value.isoformat()

    return result


def serialize_time(value):
    if value is None:
        return None

    if hasattr(value, "total_seconds"):
        seconds = int(value.total_seconds())
        return f"{seconds // 3600:02d}:{(seconds % 3600) // 60:02d}"

    if hasattr(value, "strftime"):
        return value.strftime("%H:%M")

    return str(value)[:5]


CLASS_SQL = """
SELECT
    l.ma_lop,
    l.ten_lop,
    k.ten_khoa_hoc AS khoa_hoc,
    l.ngay_bat_dau,
    l.ngay_ket_thuc,
    l.si_so_toi_da,
    l.trang_thai,
    (
        SELECT COUNT(*)
        FROM xep_lop x
        WHERE x.ma_lop = l.ma_lop
          AND x.trang_thai = 'Đang học'
    ) AS si_so
FROM lop_hoc l
JOIN khoa_hoc k
    ON k.ma_khoa_hoc = l.ma_khoa_hoc
WHERE l.ma_giao_vien = :teacher_id
"""


@router.get("")
def get_my_classes(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Giáo viên")),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text(CLASS_SQL + " ORDER BY l.ma_lop ASC"),
        {"teacher_id": teacher_id},
    ).mappings().all()

    classes = [serialize_class(row) for row in rows]

    return {
        "items": classes,
        "stats": {
            "total_classes": len(classes),
            "total_students": sum(
                item["si_so"] for item in classes
            ),
            "active_classes": sum(
                item["trang_thai"] == "Đang học"
                for item in classes
            ),
        },
    }


@router.get("/{class_id}")
def get_my_class_detail(
    class_id: int,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(require_roles("Giáo viên")),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    row = db.execute(
        text(
            CLASS_SQL +
            " AND l.ma_lop = :class_id"
        ),
        {
            "teacher_id": teacher_id,
            "class_id": class_id,
        },
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lớp được phân công",
        )

    students = db.execute(
        text("""
            SELECT
                h.ma_hoc_vien,
                h.ho_ten,
                h.email,
                h.so_dien_thoai
            FROM xep_lop x
            JOIN hoc_vien h
                ON h.ma_hoc_vien = x.ma_hoc_vien
            WHERE x.ma_lop = :class_id
              AND x.trang_thai = 'Đang học'
            ORDER BY h.ma_hoc_vien ASC
        """),
        {"class_id": class_id},
    ).mappings().all()

    schedules = db.execute(
        text("""
            SELECT
                ma_lich,
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
                gio_bat_dau ASC
        """),
        {"class_id": class_id},
    ).mappings().all()

    schedule_items = []

    for schedule in schedules:
        start = serialize_time(schedule["gio_bat_dau"])
        end = serialize_time(schedule["gio_ket_thuc"])

        schedule_items.append({
            "ma_lich": schedule["ma_lich"],
            "thu": schedule["thu"],
            "gio": f"{start} - {end}",
            "phong": schedule["phong_hoc"],
        })

    result = serialize_class(row)
    result["hoc_vien"] = [dict(s) for s in students]
    result["lich_hoc"] = schedule_items

    return result
