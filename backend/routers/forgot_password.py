from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

# Khai báo router trước khi sử dụng @router.post()
router = APIRouter(
    prefix="/api/auth",
    tags=["Forgot Password"]
)


class EmailLookupRequest(BaseModel):
    email: EmailStr




@router.post("/forgot-password")
def lookup_email(
    data: EmailLookupRequest,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    accounts = db.execute(
        text("""
            SELECT
                tk.ma_tai_khoan,
                tk.ten_dang_nhap,
                CASE
                    WHEN tk.vai_tro = 'Quản trị viên'
                        THEN tk.email
                    WHEN tk.vai_tro = 'Giáo viên'
                        THEN gv.email
                    WHEN tk.vai_tro = 'Học viên'
                        THEN hv.email
                END AS email
            FROM tai_khoan tk
            LEFT JOIN giao_vien gv
                ON gv.ma_tai_khoan = tk.ma_tai_khoan
            LEFT JOIN hoc_vien hv
                ON hv.ma_tai_khoan = tk.ma_tai_khoan
            WHERE tk.trang_thai = 1
        """)
    ).mappings().all()

    matched = [
        account
        for account in accounts
        if account["email"]
        and account["email"].strip().lower() == email
    ]

    if not matched:
        raise HTTPException(
            status_code=404,
            detail="Email không tồn tại trong hệ thống"
        )

    if len(matched) > 1:
        raise HTTPException(
            status_code=409,
            detail="Email liên kết với nhiều tài khoản. Vui lòng liên hệ quản trị viên."
        )

    return {
        "message": "Đã tìm thấy tài khoản",
        "email": email
    }

from pydantic import Field
from models import TaiKhoan
from security import hash_password, verify_password


class EmailChangePasswordRequest(BaseModel):
    email: EmailStr
    mat_khau_cu: str
    mat_khau_moi: str = Field(min_length=8, max_length=128)


@router.post("/email-change-password")
def email_change_password(
    data: EmailChangePasswordRequest,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    accounts = db.execute(
        text("""
            SELECT
                tk.ma_tai_khoan,
                CASE
                    WHEN tk.vai_tro = 'Quản trị viên'
                        THEN tk.email
                    WHEN tk.vai_tro = 'Giáo viên'
                        THEN gv.email
                    WHEN tk.vai_tro = 'Học viên'
                        THEN hv.email
                END AS email
            FROM tai_khoan tk
            LEFT JOIN giao_vien gv
                ON gv.ma_tai_khoan = tk.ma_tai_khoan
            LEFT JOIN hoc_vien hv
                ON hv.ma_tai_khoan = tk.ma_tai_khoan
            WHERE tk.trang_thai = 1
        """)
    ).mappings().all()

    matched = [
        row for row in accounts
        if row["email"]
        and row["email"].strip().lower() == email
    ]

    if len(matched) != 1:
        raise HTTPException(
            status_code=400,
            detail="Không thể xác định tài khoản"
        )

    account = db.query(TaiKhoan).filter(
        TaiKhoan.ma_tai_khoan
        == matched[0]["ma_tai_khoan"]
    ).first()

    if not account or not verify_password(
        data.mat_khau_cu,
        account.mat_khau
    ):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu hiện tại không chính xác"
        )

    if data.mat_khau_cu == data.mat_khau_moi:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu mới phải khác mật khẩu hiện tại"
        )

    account.mat_khau = hash_password(
        data.mat_khau_moi
    )
    db.commit()

    return {"message": "Đổi mật khẩu thành công"}