
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
    prefix="/api/hoc-vien",
    tags=["Quản lý học viên"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)


class HocVienCreate(BaseModel):
    ten_dang_nhap: str = Field(min_length=3, max_length=50)
    mat_khau: str = Field(min_length=8, max_length=128)
    ho_ten: str = Field(min_length=1, max_length=100)
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=100)
    so_dien_thoai: Optional[str] = Field(default=None, max_length=15)
    dia_chi: Optional[str] = Field(default=None, max_length=255)
    trang_thai: bool = True


class HocVienUpdate(BaseModel):
    ho_ten: str = Field(min_length=1, max_length=100)
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=100)
    so_dien_thoai: Optional[str] = Field(default=None, max_length=15)
    dia_chi: Optional[str] = Field(default=None, max_length=255)
    trang_thai: bool = True


SELECT_HOC_VIEN = """
SELECT
    hv.ma_hoc_vien,
    hv.ma_tai_khoan,
    hv.ho_ten,
    hv.ngay_sinh,
    hv.gioi_tinh,
    hv.email,
    hv.so_dien_thoai,
    hv.dia_chi,
    hv.trang_thai,
    tk.ten_dang_nhap,
    tk.trang_thai AS trang_thai_tai_khoan
FROM hoc_vien hv
LEFT JOIN tai_khoan tk
    ON hv.ma_tai_khoan = tk.ma_tai_khoan
"""


def serialize(row):
    data = dict(row)

    if data.get("ngay_sinh"):
        data["ngay_sinh"] = data["ngay_sinh"].isoformat()

    data["trang_thai"] = bool(data["trang_thai"])

    if data.get("trang_thai_tai_khoan") is not None:
        data["trang_thai_tai_khoan"] = bool(
            data["trang_thai_tai_khoan"]
        )

    return data


def get_student(db, student_id):
    row = db.execute(
        text(
            SELECT_HOC_VIEN
            + " WHERE hv.ma_hoc_vien = :id"
        ),
        {"id": student_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy học viên"
        )

    return row


def validate_gender(gender):
    if gender not in (None, "Nam", "Nữ", "Khác"):
        raise HTTPException(
            status_code=400,
            detail="Giới tính không hợp lệ"
        )


def clean_optional(value):
    return value.strip() or None if isinstance(value, str) else value


@router.get("")
def list_students(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=100),
    db: Session = Depends(get_db),
):
    keyword = search.strip()

    where = """
    WHERE (
        :empty_search = 1
        OR hv.ho_ten LIKE :keyword
        OR hv.email LIKE :keyword
        OR hv.so_dien_thoai LIKE :keyword
        OR tk.ten_dang_nhap LIKE :keyword
        OR CAST(hv.ma_hoc_vien AS CHAR) LIKE :keyword
    )
    """

    params = {
        "empty_search": 1 if not keyword else 0,
        "keyword": f"%{keyword}%",
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }

    count_query = """
    SELECT COUNT(*)
    FROM hoc_vien hv
    LEFT JOIN tai_khoan tk
        ON hv.ma_tai_khoan = tk.ma_tai_khoan
    """

    total = db.execute(
        text(count_query + where),
        params,
    ).scalar_one()

    rows = db.execute(
        text(
            SELECT_HOC_VIEN
            + where
            + """
            ORDER BY hv.ma_hoc_vien ASC
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    ).mappings().all()

    return {
        "items": [serialize(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{student_id}")
def student_detail(
    student_id: int,
    db: Session = Depends(get_db),
):
    return serialize(get_student(db, student_id))


@router.post("", status_code=201)
def create_student(
    data: HocVienCreate,
    db: Session = Depends(get_db),
):
    username = data.ten_dang_nhap.strip()
    name = data.ho_ten.strip()

    if not username or not name:
        raise HTTPException(
            status_code=400,
            detail="Tên đăng nhập và họ tên không được để trống"
        )

    validate_gender(data.gioi_tinh)

    existing = db.execute(
        text("""
            SELECT ma_tai_khoan
            FROM tai_khoan
            WHERE ten_dang_nhap = :username
        """),
        {"username": username},
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Tên đăng nhập đã tồn tại"
        )

    try:
        account_result = db.execute(
            text("""
                INSERT INTO tai_khoan
                (
                    ten_dang_nhap,
                    mat_khau,
                    vai_tro,
                    trang_thai
                )
                VALUES
                (
                    :username,
                    :password,
                    'Học viên',
                    :status
                )
            """),
            {
                "username": username,
                "password": hash_password(data.mat_khau),
                "status": int(data.trang_thai),
            },
        )

        account_id = account_result.lastrowid

        student_result = db.execute(
            text("""
                INSERT INTO hoc_vien
                (
                    ma_tai_khoan,
                    ho_ten,
                    ngay_sinh,
                    gioi_tinh,
                    email,
                    so_dien_thoai,
                    dia_chi,
                    trang_thai
                )
                VALUES
                (
                    :account_id,
                    :name,
                    :birth_date,
                    :gender,
                    :email,
                    :phone,
                    :address,
                    :status
                )
            """),
            {
                "account_id": account_id,
                "name": name,
                "birth_date": data.ngay_sinh,
                "gender": data.gioi_tinh,
                "email": clean_optional(data.email),
                "phone": clean_optional(data.so_dien_thoai),
                "address": clean_optional(data.dia_chi),
                "status": int(data.trang_thai),
            },
        )

        student_id = student_result.lastrowid
        db.commit()

        return serialize(get_student(db, student_id))

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Không thể thêm vì dữ liệu bị trùng hoặc vi phạm ràng buộc"
        )
    except Exception:
        db.rollback()
        raise


@router.put("/{student_id}")
def update_student(
    student_id: int,
    data: HocVienUpdate,
    db: Session = Depends(get_db),
):
    student = get_student(db, student_id)
    name = data.ho_ten.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Họ tên không được để trống"
        )

    validate_gender(data.gioi_tinh)

    try:
        db.execute(
            text("""
                UPDATE hoc_vien
                SET
                    ho_ten = :name,
                    ngay_sinh = :birth_date,
                    gioi_tinh = :gender,
                    email = :email,
                    so_dien_thoai = :phone,
                    dia_chi = :address,
                    trang_thai = :status
                WHERE ma_hoc_vien = :id
            """),
            {
                "id": student_id,
                "name": name,
                "birth_date": data.ngay_sinh,
                "gender": data.gioi_tinh,
                "email": clean_optional(data.email),
                "phone": clean_optional(data.so_dien_thoai),
                "address": clean_optional(data.dia_chi),
                "status": int(data.trang_thai),
            },
        )

        if student["ma_tai_khoan"] is not None:
            db.execute(
                text("""
                    UPDATE tai_khoan
                    SET trang_thai = :status
                    WHERE ma_tai_khoan = :account_id
                """),
                {
                    "status": int(data.trang_thai),
                    "account_id": student["ma_tai_khoan"],
                },
            )

        db.commit()
        return serialize(get_student(db, student_id))

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Dữ liệu cập nhật không hợp lệ"
        )
    except Exception:
        db.rollback()
        raise


@router.patch("/{student_id}/trang-thai")
def change_student_status(
    student_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    if type(data.get("trang_thai")) is not bool:
        raise HTTPException(
            status_code=422,
            detail="trang_thai phải là true hoặc false"
        )

    student = get_student(db, student_id)
    status_value = int(data["trang_thai"])

    try:
        db.execute(
            text("""
                UPDATE hoc_vien
                SET trang_thai = :status
                WHERE ma_hoc_vien = :id
            """),
            {
                "status": status_value,
                "id": student_id,
            },
        )

        if student["ma_tai_khoan"] is not None:
            db.execute(
                text("""
                    UPDATE tai_khoan
                    SET trang_thai = :status
                    WHERE ma_tai_khoan = :account_id
                """),
                {
                    "status": status_value,
                    "account_id": student["ma_tai_khoan"],
                },
            )

        db.commit()
        return serialize(get_student(db, student_id))

    except Exception:
        db.rollback()
        raise
