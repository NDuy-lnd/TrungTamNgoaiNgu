
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from security import hash_password, require_roles


router = APIRouter(
    prefix="/api/giao-vien",
    tags=["Quản lý giáo viên"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)


class GiaoVienData(BaseModel):
    ho_ten: str = Field(min_length=1, max_length=100)
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=100)
    so_dien_thoai: Optional[str] = Field(default=None, max_length=15)
    chuyen_mon: Optional[str] = Field(default=None, max_length=100)
    trang_thai: bool = True


class GiaoVienCreate(GiaoVienData):
    ten_dang_nhap: str = Field(min_length=3, max_length=50)
    mat_khau: str = Field(min_length=8, max_length=128)


class GiaoVienStatus(BaseModel):
    trang_thai: bool


SELECT_SQL = """
SELECT
    gv.ma_giao_vien,
    gv.ma_tai_khoan,
    gv.ho_ten,
    gv.ngay_sinh,
    gv.gioi_tinh,
    gv.email,
    gv.so_dien_thoai,
    gv.chuyen_mon,
    gv.trang_thai,
    tk.ten_dang_nhap
FROM giao_vien gv
JOIN tai_khoan tk
    ON gv.ma_tai_khoan = tk.ma_tai_khoan
"""


def serialize(row):
    result = dict(row)
    if result["ngay_sinh"] is not None:
        result["ngay_sinh"] = result["ngay_sinh"].isoformat()
    result["trang_thai"] = bool(result["trang_thai"])
    return result


def find_teacher(db, teacher_id):
    teacher = db.execute(
        text(SELECT_SQL + " WHERE gv.ma_giao_vien = :id"),
        {"id": teacher_id},
    ).mappings().first()

    if teacher is None:
        raise HTTPException(404, "Không tìm thấy giáo viên")

    return teacher


def validate_data(data):
    if not data.ho_ten.strip():
        raise HTTPException(400, "Họ tên không được để trống")

    if data.gioi_tinh not in (None, "Nam", "Nữ", "Khác"):
        raise HTTPException(400, "Giới tính không hợp lệ")


def teacher_params(data):
    return {
        "ho_ten": data.ho_ten.strip(),
        "ngay_sinh": data.ngay_sinh,
        "gioi_tinh": data.gioi_tinh,
        "email": data.email.strip() or None if data.email else None,
        "so_dien_thoai": (
            data.so_dien_thoai.strip() or None
            if data.so_dien_thoai else None
        ),
        "chuyen_mon": (
            data.chuyen_mon.strip() or None
            if data.chuyen_mon else None
        ),
        "trang_thai": int(data.trang_thai),
    }


@router.get("")
def list_teachers(
    search: str = "",
    status: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(7, ge=1, le=100),
    db: Session = Depends(get_db),
):
    where = """
    WHERE (
        :empty_search = 1
        OR gv.ho_ten LIKE :keyword
        OR gv.email LIKE :keyword
        OR gv.so_dien_thoai LIKE :keyword
        OR gv.chuyen_mon LIKE :keyword
        OR tk.ten_dang_nhap LIKE :keyword
    )
    AND (:all_status = 1 OR gv.trang_thai = :status)
    """

    params = {
        "empty_search": int(not search.strip()),
        "keyword": f"%{search.strip()}%",
        "all_status": int(status is None),
        "status": int(status) if status is not None else 0,
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }

    rows = db.execute(
        text(
            SELECT_SQL + where
            + " ORDER BY gv.ma_giao_vien ASC "
            + "LIMIT :limit OFFSET :offset"
        ),
        params,
    ).mappings().all()

    total = db.execute(
        text("""
            SELECT COUNT(*)
            FROM giao_vien gv
            JOIN tai_khoan tk
                ON gv.ma_tai_khoan = tk.ma_tai_khoan
        """ + where),
        params,
    ).scalar_one()

    stats = db.execute(
        text("""
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(trang_thai = 1), 0) AS active,
                COALESCE(SUM(trang_thai = 0), 0) AS inactive
            FROM giao_vien
        """)
    ).mappings().one()

    return {
        "items": [serialize(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "stats": dict(stats),
    }


@router.get("/{teacher_id}")
def teacher_detail(
    teacher_id: int,
    db: Session = Depends(get_db),
):
    return serialize(find_teacher(db, teacher_id))


@router.post("", status_code=201)
def create_teacher(
    data: GiaoVienCreate,
    db: Session = Depends(get_db),
):
    validate_data(data)
    username = data.ten_dang_nhap.strip()

    if not username:
        raise HTTPException(400, "Tên đăng nhập không được để trống")

    existing = db.execute(
        text("""
            SELECT ma_tai_khoan
            FROM tai_khoan
            WHERE ten_dang_nhap = :username
        """),
        {"username": username},
    ).first()

    if existing:
        raise HTTPException(409, "Tên đăng nhập đã tồn tại")

    try:
        account = db.execute(
            text("""
                INSERT INTO tai_khoan
                    (ten_dang_nhap, mat_khau, vai_tro, trang_thai)
                VALUES
                    (:username, :password, 'Giáo viên', :trang_thai)
            """),
            {
                "username": username,
                "password": hash_password(data.mat_khau),
                "trang_thai": int(data.trang_thai),
            },
        )

        params = teacher_params(data)
        params["ma_tai_khoan"] = account.lastrowid

        result = db.execute(
            text("""
                INSERT INTO giao_vien (
                    ma_tai_khoan, ho_ten, ngay_sinh, gioi_tinh,
                    email, so_dien_thoai, chuyen_mon, trang_thai
                )
                VALUES (
                    :ma_tai_khoan, :ho_ten, :ngay_sinh, :gioi_tinh,
                    :email, :so_dien_thoai, :chuyen_mon, :trang_thai
                )
            """),
            params,
        )

        teacher_id = result.lastrowid
        db.commit()

        return serialize(find_teacher(db, teacher_id))

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Tên đăng nhập trùng hoặc dữ liệu vi phạm ràng buộc"
        )
    except Exception:
        db.rollback()
        raise


@router.put("/{teacher_id}")
def update_teacher(
    teacher_id: int,
    data: GiaoVienData,
    db: Session = Depends(get_db),
):
    teacher = find_teacher(db, teacher_id)
    validate_data(data)

    params = teacher_params(data)
    params["id"] = teacher_id
    params["account_id"] = teacher["ma_tai_khoan"]

    try:
        db.execute(
            text("""
                UPDATE giao_vien
                SET ho_ten = :ho_ten,
                    ngay_sinh = :ngay_sinh,
                    gioi_tinh = :gioi_tinh,
                    email = :email,
                    so_dien_thoai = :so_dien_thoai,
                    chuyen_mon = :chuyen_mon,
                    trang_thai = :trang_thai
                WHERE ma_giao_vien = :id
            """),
            params,
        )

        db.execute(
            text("""
                UPDATE tai_khoan
                SET trang_thai = :trang_thai
                WHERE ma_tai_khoan = :account_id
            """),
            params,
        )

        db.commit()
        return serialize(find_teacher(db, teacher_id))

    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Dữ liệu cập nhật không hợp lệ")
    except Exception:
        db.rollback()
        raise


@router.patch("/{teacher_id}/trang-thai")
def change_teacher_status(
    teacher_id: int,
    data: GiaoVienStatus,
    db: Session = Depends(get_db),
):
    teacher = find_teacher(db, teacher_id)
    params = {
        "id": teacher_id,
        "account_id": teacher["ma_tai_khoan"],
        "status": int(data.trang_thai),
    }

    try:
        db.execute(
            text("""
                UPDATE giao_vien
                SET trang_thai = :status
                WHERE ma_giao_vien = :id
            """),
            params,
        )

        db.execute(
            text("""
                UPDATE tai_khoan
                SET trang_thai = :status
                WHERE ma_tai_khoan = :account_id
            """),
            params,
        )

        db.commit()
        return serialize(find_teacher(db, teacher_id))

    except Exception:
        db.rollback()
        raise
