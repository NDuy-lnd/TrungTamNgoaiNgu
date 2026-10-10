from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

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