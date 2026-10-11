
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from security import require_roles


router = APIRouter(
    prefix="/api/khoa-hoc",
    tags=["Quản lý khóa học"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)


class KhoaHocData(BaseModel):
    ten_khoa_hoc: str = Field(min_length=1, max_length=150)
    ngon_ngu: str = Field(min_length=1, max_length=50)
    mo_ta: Optional[str] = None
    so_buoi: int = Field(ge=1, le=500)
    muc_tieu: Optional[str] = None
    trang_thai: bool = True

    @field_validator("ten_khoa_hoc", "ngon_ngu")
    @classmethod
    def not_blank(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Không được để trống")
        return value


class KhoaHocStatus(BaseModel):
    trang_thai: bool


SELECT_SQL = """
SELECT
    ma_khoa_hoc,
    ten_khoa_hoc,
    ngon_ngu,
    mo_ta,
    so_buoi,
    muc_tieu,
    trang_thai
FROM khoa_hoc
"""


def serialize(row):
    result = dict(row)
    result["trang_thai"] = bool(result["trang_thai"])
    return result


def find_course(db, course_id):
    row = db.execute(
        text(SELECT_SQL + " WHERE ma_khoa_hoc = :id"),
        {"id": course_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khóa học",
        )

    return row


def course_params(data):
    return {
        "ten_khoa_hoc": data.ten_khoa_hoc,
        "ngon_ngu": data.ngon_ngu,
        "mo_ta": data.mo_ta.strip() or None if data.mo_ta else None,
        "so_buoi": data.so_buoi,
        "muc_tieu": (
            data.muc_tieu.strip() or None
            if data.muc_tieu else None
        ),
        "trang_thai": int(data.trang_thai),
    }


@router.get("")
def list_courses(
    search: str = "",
    status: Optional[bool] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    db: Session = Depends(get_db),
):
    where_sql = """
    WHERE (
        :empty_search = 1
        OR ten_khoa_hoc LIKE :keyword
        OR ngon_ngu LIKE :keyword
        OR CAST(ma_khoa_hoc AS CHAR) LIKE :keyword
    )
    AND (
        :all_status = 1
        OR trang_thai = :status
    )
    """

    params = {
        "empty_search": int(not search.strip()),
        "keyword": f"%{search.strip()}%",
        "all_status": int(status is None),
        "status": int(status) if status is not None else 0,
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }

    total = db.execute(
        text("SELECT COUNT(*) FROM khoa_hoc " + where_sql),
        params,
    ).scalar_one()

    rows = db.execute(
        text(
            SELECT_SQL
            + where_sql
            + """
            ORDER BY ma_khoa_hoc ASC
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    ).mappings().all()

    stats = db.execute(
        text("""
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(trang_thai = 1), 0) AS active,
                COALESCE(SUM(trang_thai = 0), 0) AS inactive
            FROM khoa_hoc
        """)
    ).mappings().one()

    return {
        "items": [serialize(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "stats": dict(stats),
    }


@router.get("/{course_id}")
def course_detail(
    course_id: int,
    db: Session = Depends(get_db),
):
    return serialize(find_course(db, course_id))


@router.post("", status_code=201)
def create_course(
    data: KhoaHocData,
    db: Session = Depends(get_db),
):
    params = course_params(data)

    try:
        result = db.execute(
            text("""
                INSERT INTO khoa_hoc (
                    ten_khoa_hoc,
                    ngon_ngu,
                    mo_ta,
                    so_buoi,
                    muc_tieu,
                    trang_thai
                )
                VALUES (
                    :ten_khoa_hoc,
                    :ngon_ngu,
                    :mo_ta,
                    :so_buoi,
                    :muc_tieu,
                    :trang_thai
                )
            """),
            params,
        )

        course_id = result.lastrowid
        db.commit()

        return serialize(find_course(db, course_id))

    except Exception:
        db.rollback()
        raise


@router.put("/{course_id}")
def update_course(
    course_id: int,
    data: KhoaHocData,
    db: Session = Depends(get_db),
):
    find_course(db, course_id)

    params = course_params(data)
    params["id"] = course_id

    try:
        db.execute(
            text("""
                UPDATE khoa_hoc
                SET
                    ten_khoa_hoc = :ten_khoa_hoc,
                    ngon_ngu = :ngon_ngu,
                    mo_ta = :mo_ta,
                    so_buoi = :so_buoi,
                    muc_tieu = :muc_tieu,
                    trang_thai = :trang_thai
                WHERE ma_khoa_hoc = :id
            """),
            params,
        )

        db.commit()
        return serialize(find_course(db, course_id))

    except Exception:
        db.rollback()
        raise


@router.patch("/{course_id}/trang-thai")
def change_course_status(
    course_id: int,
    data: KhoaHocStatus,
    db: Session = Depends(get_db),
):
    find_course(db, course_id)

    try:
        db.execute(
            text("""
                UPDATE khoa_hoc
                SET trang_thai = :status
                WHERE ma_khoa_hoc = :id
            """),
            {
                "status": int(data.trang_thai),
                "id": course_id,
            },
        )

        db.commit()
        return serialize(find_course(db, course_id))

    except Exception:
        db.rollback()
        raise
