
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import AdminResetPasswordRequest
from security import hash_password, require_roles
from schemas import ChangePasswordRequest
from security import verify_password

from database import get_db
from models import TaiKhoan, GiaoVien, HocVien
from schemas import LoginRequest, LoginResponse, UserResponse
from security import (
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


def build_user_response(account, db):
    ho_ten = None
    user_id = None

    if account.vai_tro == "Giáo viên":
        teacher = db.query(GiaoVien).filter(
            GiaoVien.ma_tai_khoan == account.ma_tai_khoan
        ).first()

        ho_ten = teacher.ho_ten if teacher else "Giáo viên"
        user_id = teacher.ma_giao_vien if teacher else None

    elif account.vai_tro == "Học viên":
        student = db.query(HocVien).filter(
            HocVien.ma_tai_khoan == account.ma_tai_khoan
        ).first()

        ho_ten = student.ho_ten if student else "Học viên"
        user_id = student.ma_hoc_vien if student else None

    else:
        ho_ten = "Quản trị viên"

    return UserResponse(
        ma_tai_khoan=account.ma_tai_khoan,
        ten_dang_nhap=account.ten_dang_nhap,
        vai_tro=account.vai_tro,
        ho_ten=ho_ten,
        ma_nguoi_dung=user_id
    )


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    account = db.query(TaiKhoan).filter(
        TaiKhoan.ten_dang_nhap == data.ten_dang_nhap
    ).first()

    if not account or not verify_password(
        data.mat_khau, account.mat_khau
    ):
        raise HTTPException(
            status_code=401,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác"
        )

    if not account.trang_thai:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    access_token = create_access_token(
        account.ma_tai_khoan
    )

    return LoginResponse(
        access_token=access_token,
        user=build_user_response(account, db)
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    account: TaiKhoan = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return build_user_response(account, db)


@router.put("/admin/reset-password/{account_id}")
def admin_reset_password(
    account_id: int,
    data: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    admin: TaiKhoan = Depends(
        require_roles("Quản trị viên")
    )
):
    account = db.query(TaiKhoan).filter(
        TaiKhoan.ma_tai_khoan == account_id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tài khoản"
        )

    if account.vai_tro == "Quản trị viên":
        raise HTTPException(
            status_code=403,
            detail="Không thể đặt lại mật khẩu Admin bằng chức năng này"
        )

    account.mat_khau = hash_password(
        data.mat_khau_moi
    )

    db.commit()

    return {
        "message": "Đặt lại mật khẩu thành công"
    }


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    account: TaiKhoan = Depends(get_current_user)
):
    if not verify_password(
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
            detail="Mật khẩu mới phải khác mật khẩu cũ"
        )

    account.mat_khau = hash_password(
        data.mat_khau_moi
    )

    db.commit()

    return {
        "message": "Đổi mật khẩu thành công"
    }
