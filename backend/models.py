from sqlalchemy import Column, Integer,Text, String, Boolean, Enum, Date, ForeignKey, UniqueConstraint, DateTime, DECIMAL, Time

from database import Base


class TaiKhoan(Base):
    __tablename__ = "tai_khoan"

    ma_tai_khoan = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ten_dang_nhap = Column(
        String(50),
        unique=True,
        nullable=False
    )

    mat_khau = Column(
        String(255),
        nullable=False
    )

    vai_tro = Column(
        Enum("Quản trị viên", "Giáo viên", "Học viên"),
        nullable=False
    )

    trang_thai = Column(
        Boolean,
        nullable=False,
        default=True
    )

class HocVien(Base):
    __tablename__ = "hoc_vien"
    ma_hoc_vien = Column(
        Integer,
        primary_key=True
    )
    ma_tai_khoan = Column(
        Integer,
        ForeignKey("tai_khoan.ma_tai_khoan"),
        nullable=False,
        unique=True
    )
    ho_ten = Column(
        String(100),
        nullable=False
    )

    ngay_sinh = Column(
        Date
    )

    gioi_tinh = Column(
        Enum("Nam", "Nữ", "Khác")
    )

    email = Column(
        String(100)
    )

    so_dien_thoai = Column(
        String(15)
    )

    dia_chi = Column(
        String(255)
    )

    trang_thai = Column(
        Boolean,
        nullable=False,
        default=True
    )

class GiaoVien(Base):
    __tablename__ = "giao_vien"

    ma_giao_vien = Column(
        Integer,
        primary_key=True
    )

    ma_tai_khoan = Column(
        Integer,
        ForeignKey("tai_khoan.ma_tai_khoan"),
        nullable=False,
        unique=True
    )

    ho_ten = Column(
        String(100),
        nullable=False
    )

    ngay_sinh = Column(
        Date
    )

    gioi_tinh = Column(
        Enum("Nam", "Nữ")
    )

    email = Column(
        String(100)
    )

    so_dien_thoai = Column(
        String(15)
    )

    chuyen_mon = Column(
        String(100)
    )

    trang_thai = Column(
        Boolean,
        nullable=False,
        default=True
    )

class KhoaHoc(Base):
    __tablename__ = "khoa_hoc"

    ma_khoa_hoc = Column(
        Integer,
        primary_key=True
    )

    ten_khoa_hoc = Column(
        String(150),
        nullable=False
    )
    ngon_ngu = Column(String(50), nullable=False)

    mo_ta = Column(
        Text
    )

    so_buoi = Column(
        Integer
    )

    muc_tieu = Column(
        Text
    )

    trang_thai = Column(
        Boolean,
        nullable=False,
        default=True
    )

class LopHoc(Base):
    __tablename__ = "lop_hoc"

    ma_lop = Column(
        Integer,
        primary_key=True
    )

    ma_khoa_hoc = Column(
        Integer,
        ForeignKey("khoa_hoc.ma_khoa_hoc"),
        nullable=False
    )

    ma_giao_vien = Column(
        Integer,
        ForeignKey("giao_vien.ma_giao_vien"),
        nullable=True
    )

    ten_lop = Column(
        String(100),
        nullable=False
    )

    si_so_toi_da = Column(
        Integer,
        nullable=False
    )

    ngay_bat_dau = Column(
        Date,
        nullable=False
    )

    ngay_ket_thuc = Column(
        Date,
        nullable=False
    )

    trang_thai = Column(
        Enum("Sắp mở", "Đang học", "Đã kết thúc"),
        nullable=False,
        default="Sắp mở"
    )

class XepLop(Base):
    __tablename__ = "xep_lop"

    ma_xep_lop = Column(
        Integer,
        primary_key=True
    )

    ma_hoc_vien = Column(
        Integer,
        ForeignKey("hoc_vien.ma_hoc_vien"),
        nullable=False
    )

    ma_lop = Column(
        Integer,
        ForeignKey("lop_hoc.ma_lop"),
        nullable=False
    )

    ngay_xep = Column(
        Date,
        nullable=False
    )

    trang_thai = Column(
        Enum("Đang học", "Đã hoàn thành", "Đã rời lớp"),
        nullable=False,
        default="Đang học"
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_hoc_vien",
            "ma_lop",
            name="uq_xeplop_hocvien_lop"
        ),
    )

class LichHoc(Base):
    __tablename__ = "lich_hoc"

    ma_lich = Column(
        Integer,
        primary_key=True
    )

    ma_lop = Column(
        Integer,
        ForeignKey("lop_hoc.ma_lop"),
        nullable=False
    )

    thu = Column(
        Enum(
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
            "Chủ nhật"
        ),
        nullable=False
    )

    gio_bat_dau = Column(
        Time,
        nullable=False
    )

    gio_ket_thuc = Column(
        Time,
        nullable=False
    )

    phong_hoc = Column(
        String(50),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_lop",
            "thu",
            "gio_bat_dau",
            name="uq_lichhoc_lop_thu_gio"
        ),
    )

class DiemDanh(Base):
    __tablename__ = "diem_danh"

    ma_diem_danh = Column(
        Integer,
        primary_key=True
    )

    ma_xep_lop = Column(
        Integer,
        ForeignKey("xep_lop.ma_xep_lop"),
        nullable=False
    )

    ngay_hoc = Column(
        Date,
        nullable=False
    )

    trang_thai = Column(
        Enum("Có mặt", "Vắng mặt"),
        nullable=False
    )

    ghi_chu = Column(
        String(255)
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_xep_lop",
            "ngay_hoc",
            name="uq_diemdanh_xeplop_ngay"
        ),
    )

class Diem(Base):
    __tablename__ = "diem"

    ma_diem = Column(
        Integer,
        primary_key=True
    )

    ma_xep_lop = Column(
        Integer,
        ForeignKey("xep_lop.ma_xep_lop"),
        nullable=False,
        unique=True
    )

    diem_tong_ket = Column(
        DECIMAL(4, 2)
    )

class TaiLieu(Base):
    __tablename__ = "tai_lieu"

    ma_tai_lieu = Column(
        Integer,
        primary_key=True
    )

    ma_lop = Column(
        Integer,
        ForeignKey("lop_hoc.ma_lop"),
        nullable=False
    )

    ten_tai_lieu = Column(
        String(255),
        nullable=False
    )

    duong_dan_file = Column(
        String(500),
        nullable=False
    )

    ngay_dang = Column(
        DateTime
    )

    mo_ta = Column(
        String(500)
    )