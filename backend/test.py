from database import SessionLocal
from models import HocVien, XepLop, LopHoc


db = SessionLocal()

try:
    ket_qua = (
        db.query(HocVien, LopHoc)
        .join(
            XepLop,
            HocVien.ma_hoc_vien == XepLop.ma_hoc_vien
        )
        .join(
            LopHoc,
            XepLop.ma_lop == LopHoc.ma_lop
        )
        .all()
    )

    for hoc_vien, lop_hoc in ket_qua:
        print(
            hoc_vien.ho_ten,
            "->",
            lop_hoc.ten_lop
        )

finally:
    db.close()