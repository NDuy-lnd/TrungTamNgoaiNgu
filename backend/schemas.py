
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HocVienResponse(BaseModel):
    ma_hoc_vien: int
    ma_tai_khoan: int
    ho_ten: str
    ngay_sinh: Optional[date] = None
    gioi_tinh: Optional[str] = None
    email: Optional[str] = None
    so_dien_thoai: Optional[str] = None
    dia_chi: Optional[str] = None
    trang_thai: bool

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    ten_dang_nhap: str
    mat_khau: str


class UserResponse(BaseModel):
    ma_tai_khoan: int
    ten_dang_nhap: str
    vai_tro: str
    ho_ten: Optional[str] = None
    ma_nguoi_dung: Optional[int] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


from pydantic import Field


class AdminResetPasswordRequest(BaseModel):
    mat_khau_moi: str = Field(
        min_length=8,
        max_length=128
    )


from pydantic import BaseModel, Field

class ChangePasswordRequest(BaseModel):
    mat_khau_cu: str
    mat_khau_moi: str = Field(min_length=8, max_length=128)

