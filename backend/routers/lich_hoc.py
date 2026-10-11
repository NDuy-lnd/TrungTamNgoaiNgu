
from datetime import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from security import require_roles


router = APIRouter(
    prefix="/api/lich-hoc",
    tags=["Quản lý lịch học"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)

Thu = Literal[
    "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5",
    "Thứ 6", "Thứ 7", "Chủ nhật"
]


class LichHocData(BaseModel):
    ma_lop: int = Field(gt=0)
    thu: Thu
    gio_bat_dau: time
    gio_ket_thuc: time
    phong_hoc: str = Field(min_length=1, max_length=50)

    @field_validator("phong_hoc")
    @classmethod
    def clean_room(cls, value):
        value = value.strip().upper()
        if not value:
            raise ValueError("Phòng học không được để trống")
        return value

    @model_validator(mode="after")
    def validate_times(self):
        if self.gio_bat_dau >= self.gio_ket_thuc:
            raise ValueError("Giờ kết thúc phải sau giờ bắt đầu")
        return self


SELECT_SQL = """
SELECT
    lh.ma_lich,
    lh.ma_lop,
    l.ten_lop,
    lh.thu,
    lh.gio_bat_dau,
    lh.gio_ket_thuc,
    lh.phong_hoc
FROM lich_hoc lh
JOIN lop_hoc l ON l.ma_lop = lh.ma_lop
"""


def serialize(row):
    result = dict(row)

    for field in ("gio_bat_dau", "gio_ket_thuc"):
        value = result[field]
        if isinstance(value, time):
            result[field] = value.strftime("%H:%M")
        else:
            # MySQL/PyMySQL đôi khi trả về timedelta
            # đối với cột TIME.
            seconds = int(value.total_seconds())
            result[field] = (
                f"{seconds // 3600:02d}:"
                f"{(seconds % 3600) // 60:02d}"
            )

    return result


def find_schedule(db, schedule_id):
    row = db.execute(
        text(SELECT_SQL + " WHERE lh.ma_lich = :id"),
        {"id": schedule_id},
    ).mappings().first()

    if not row:
        raise HTTPException(404, "Không tìm thấy lịch học")

    return row


def check_class(db, class_id):
    row = db.execute(
        text("""
            SELECT ma_lop, trang_thai
            FROM lop_hoc
            WHERE ma_lop = :id
        """),
        {"id": class_id},
    ).mappings().first()

    if not row:
        raise HTTPException(400, "Lớp học không tồn tại")

    if row["trang_thai"] == "Đã kết thúc":
        raise HTTPException(
            400,
            "Không thể phân lịch cho lớp đã kết thúc",
        )


def check_conflict(db, data, exclude_id=None):
    conflict = db.execute(
        text("""
            SELECT
                lh.ma_lich,
                lh.ma_lop,
                l.ten_lop,
                lh.phong_hoc
            FROM lich_hoc lh
            JOIN lop_hoc l ON l.ma_lop = lh.ma_lop
            WHERE lh.thu = :thu
              AND lh.ma_lich != :exclude_id
              AND lh.gio_bat_dau < :gio_ket_thuc
              AND lh.gio_ket_thuc > :gio_bat_dau
              AND (
                  lh.ma_lop = :ma_lop
                  OR UPPER(lh.phong_hoc) = :phong_hoc
              )
            LIMIT 1
        """),
        {
            "thu": data.thu,
            "exclude_id": exclude_id or 0,
            "gio_bat_dau": data.gio_bat_dau,
            "gio_ket_thuc": data.gio_ket_thuc,
            "ma_lop": data.ma_lop,
            "phong_hoc": data.phong_hoc,
        },
    ).mappings().first()

    if conflict:
        reason = (
            "Lớp học bị trùng giờ"
            if conflict["ma_lop"] == data.ma_lop
            else f"Phòng {conflict['phong_hoc']} đã có lớp "
                 f"{conflict['ten_lop']} sử dụng"
        )
        raise HTTPException(409, reason)


def params_from(data):
    return {
        "ma_lop": data.ma_lop,
        "thu": data.thu,
        "gio_bat_dau": data.gio_bat_dau,
        "gio_ket_thuc": data.gio_ket_thuc,
        "phong_hoc": data.phong_hoc,
    }


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT ma_lop, ten_lop, trang_thai
            FROM lop_hoc
            ORDER BY ma_lop ASC
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("")
def list_schedules(db: Session = Depends(get_db)):
    rows = db.execute(
        text(SELECT_SQL + " ORDER BY lh.ma_lich ASC")
    ).mappings().all()

    stats = db.execute(
        text("""
            SELECT
                COUNT(*) AS total,
                COUNT(DISTINCT ma_lop) AS classes,
                COUNT(DISTINCT UPPER(phong_hoc)) AS rooms
            FROM lich_hoc
        """)
    ).mappings().one()

    return {
        "items": [serialize(row) for row in rows],
        "stats": dict(stats),
    }


@router.get("/{schedule_id}")
def schedule_detail(
    schedule_id: int,
    db: Session = Depends(get_db),
):
    return serialize(find_schedule(db, schedule_id))


@router.post("", status_code=201)
def create_schedule(
    data: LichHocData,
    db: Session = Depends(get_db),
):
    try:
        # Khóa ghi trong lúc kiểm tra và lưu để tránh
        # hai yêu cầu đồng thời tạo lịch trùng nhau.
        db.execute(text("LOCK TABLES lich_hoc WRITE, lop_hoc READ"))
        try:
            check_class(db, data.ma_lop)
            check_conflict(db, data)

            result = db.execute(
                text("""
                    INSERT INTO lich_hoc (
                        ma_lop, thu, gio_bat_dau,
                        gio_ket_thuc, phong_hoc
                    )
                    VALUES (
                        :ma_lop, :thu, :gio_bat_dau,
                        :gio_ket_thuc, :phong_hoc
                    )
                """),
                params_from(data),
            )
            schedule_id = result.lastrowid
        finally:
            db.execute(text("UNLOCK TABLES"))

        db.commit()
        return serialize(find_schedule(db, schedule_id))

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Lịch học đã tồn tại")
    except Exception:
        db.rollback()
        raise


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    data: LichHocData,
    db: Session = Depends(get_db),
):
    try:
        db.execute(text("LOCK TABLES lich_hoc WRITE, lop_hoc READ"))
        try:
            find_schedule(db, schedule_id)
            check_class(db, data.ma_lop)
            check_conflict(db, data, schedule_id)

            params = params_from(data)
            params["id"] = schedule_id

            db.execute(
                text("""
                    UPDATE lich_hoc
                    SET
                        ma_lop=:ma_lop,
                        thu=:thu,
                        gio_bat_dau=:gio_bat_dau,
                        gio_ket_thuc=:gio_ket_thuc,
                        phong_hoc=:phong_hoc
                    WHERE ma_lich=:id
                """),
                params,
            )
        finally:
            db.execute(text("UNLOCK TABLES"))

        db.commit()
        return serialize(find_schedule(db, schedule_id))

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Lịch học bị trùng")
    except Exception:
        db.rollback()
        raise


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
):
    find_schedule(db, schedule_id)

    try:
        db.execute(
            text("""
                DELETE FROM lich_hoc
                WHERE ma_lich = :id
            """),
            {"id": schedule_id},
        )
        db.commit()
        return {"message": "Đã xóa lịch học"}

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409,
            "Lịch học đang được sử dụng, không thể xóa",
        )
    except Exception:
        db.rollback()
        raise

def acquire_schedule_lock(db):
    locked = db.execute(
        text("SELECT GET_LOCK('trungtam_lich_hoc', 10)")
    ).scalar_one()

    if locked != 1:
        raise HTTPException(
            503, "Hệ thống đang cập nhật lịch, vui lòng thử lại"
        )


def release_schedule_lock(db):
    db.execute(
        text("SELECT RELEASE_LOCK('trungtam_lich_hoc')")
    )