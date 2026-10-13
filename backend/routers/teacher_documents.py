
from typing import Optional
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan
from security import require_roles


router = APIRouter(
    prefix="/api/teacher/documents",
    tags=["Giáo viên - Tài liệu lớp học"],
    dependencies=[Depends(require_roles("Giáo viên"))],
)


class DocumentData(BaseModel):
    ma_lop: int = Field(gt=0)
    ten_tai_lieu: str = Field(min_length=1, max_length=255)
    duong_dan_file: str = Field(min_length=1, max_length=500)
    mo_ta: Optional[str] = Field(default=None, max_length=500)

    @field_validator("ten_tai_lieu")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Tên tài liệu không được để trống")
        return value

    @field_validator("duong_dan_file")
    @classmethod
    def validate_url(cls, value):
        value = value.strip()

        try:
            parsed = urlsplit(value)
            valid = (
                parsed.scheme in ("http", "https")
                and bool(parsed.hostname)
                and not parsed.username
                and not parsed.password
            )
        except ValueError:
            valid = False

        if not valid:
            raise ValueError(
                "Đường dẫn phải là URL HTTP hoặc HTTPS hợp lệ"
            )

        return value

    @field_validator("mo_ta")
    @classmethod
    def validate_description(cls, value):
        return value.strip() or None if value is not None else None


def get_teacher_id(db, account_id):
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


def check_class_access(db, class_id, teacher_id):
    class_id_found = db.execute(
        text("""
            SELECT ma_lop
            FROM lop_hoc
            WHERE ma_lop = :class_id
              AND ma_giao_vien = :teacher_id
        """),
        {
            "class_id": class_id,
            "teacher_id": teacher_id,
        },
    ).scalar_one_or_none()

    if class_id_found is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lớp được phân công",
        )


def get_owned_document(db, document_id, teacher_id):
    row = db.execute(
        text("""
            SELECT
                t.ma_tai_lieu,
                t.ma_lop,
                l.ten_lop,
                t.ten_tai_lieu,
                t.duong_dan_file,
                t.ngay_dang,
                t.mo_ta
            FROM tai_lieu t
            JOIN lop_hoc l
                ON l.ma_lop = t.ma_lop
            WHERE t.ma_tai_lieu = :document_id
              AND l.ma_giao_vien = :teacher_id
        """),
        {
            "document_id": document_id,
            "teacher_id": teacher_id,
        },
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài liệu thuộc lớp của bạn",
        )

    return row


def serialize_document(row):
    result = dict(row)

    if result.get("ngay_dang") is not None:
        result["ngay_dang"] = result["ngay_dang"].isoformat()

    return result


@router.get("/classes")
def get_my_classes(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text("""
            SELECT
                ma_lop,
                ten_lop,
                trang_thai
            FROM lop_hoc
            WHERE ma_giao_vien = :teacher_id
            ORDER BY ma_lop ASC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("")
def get_documents(
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    rows = db.execute(
        text("""
            SELECT
                t.ma_tai_lieu,
                t.ma_lop,
                l.ten_lop,
                t.ten_tai_lieu,
                t.duong_dan_file,
                t.ngay_dang,
                t.mo_ta
            FROM tai_lieu t
            JOIN lop_hoc l
                ON l.ma_lop = t.ma_lop
            WHERE l.ma_giao_vien = :teacher_id
            ORDER BY
                t.ngay_dang DESC,
                t.ma_tai_lieu DESC
        """),
        {"teacher_id": teacher_id},
    ).mappings().all()

    return [
        serialize_document(row)
        for row in rows
    ]


@router.get("/{document_id}")
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    document = get_owned_document(
        db, document_id, teacher_id
    )

    return serialize_document(document)


@router.post("", status_code=201)
def create_document(
    data: DocumentData,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    check_class_access(
        db, data.ma_lop, teacher_id
    )

    try:
        result = db.execute(
            text("""
                INSERT INTO tai_lieu (
                    ma_lop,
                    ten_tai_lieu,
                    duong_dan_file,
                    mo_ta
                )
                VALUES (
                    :ma_lop,
                    :ten_tai_lieu,
                    :duong_dan_file,
                    :mo_ta
                )
            """),
            data.model_dump(),
        )

        document_id = result.lastrowid
        db.commit()

        return {
            "message": "Thêm tài liệu thành công",
            "ma_tai_lieu": document_id,
        }

    except Exception:
        db.rollback()
        raise


@router.put("/{document_id}")
def update_document(
    document_id: int,
    data: DocumentData,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    # Kiểm tra quyền đối với tài liệu hiện tại.
    get_owned_document(
        db, document_id, teacher_id
    )

    # Nếu chuyển sang lớp khác, lớp đích
    # cũng phải do giáo viên này phụ trách.
    check_class_access(
        db, data.ma_lop, teacher_id
    )

    try:
        db.execute(
            text("""
                UPDATE tai_lieu
                SET
                    ma_lop = :ma_lop,
                    ten_tai_lieu = :ten_tai_lieu,
                    duong_dan_file = :duong_dan_file,
                    mo_ta = :mo_ta
                WHERE ma_tai_lieu = :document_id
            """),
            {
                **data.model_dump(),
                "document_id": document_id,
            },
        )

        db.commit()

        return {
            "message": "Cập nhật tài liệu thành công"
        }

    except Exception:
        db.rollback()
        raise


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(
        require_roles("Giáo viên")
    ),
):
    teacher_id = get_teacher_id(
        db, account.ma_tai_khoan
    )

    get_owned_document(
        db, document_id, teacher_id
    )

    try:
        db.execute(
            text("""
                DELETE FROM tai_lieu
                WHERE ma_tai_lieu = :document_id
            """),
            {"document_id": document_id},
        )

        db.commit()

        return {
            "message": "Xóa tài liệu thành công"
        }

    except Exception:
        db.rollback()
        raise
