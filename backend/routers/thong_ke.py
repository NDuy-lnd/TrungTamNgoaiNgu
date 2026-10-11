
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from security import require_roles


router = APIRouter(
    prefix="/api/thong-ke",
    tags=["Thống kê và báo cáo"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)


@router.get("/tong-quan")
def get_overview(db: Session = Depends(get_db)):
    """
    Tổng số bản ghi hiện có trong từng bảng.
    Bao gồm cả tài khoản/hồ sơ đã tạm khóa.
    """
    result = db.execute(
        text("""
            SELECT
                (SELECT COUNT(*) FROM hoc_vien) AS students,
                (SELECT COUNT(*) FROM giao_vien) AS teachers,
                (SELECT COUNT(*) FROM khoa_hoc) AS courses,
                (SELECT COUNT(*) FROM lop_hoc) AS classes
        """)
    ).mappings().one()

    return dict(result)


@router.get("/trang-thai-lop")
def get_class_status(db: Session = Depends(get_db)):
    """
    Số lượng lớp theo từng trạng thái.
    Luôn trả đủ ba trạng thái, kể cả khi bằng 0.
    """
    rows = db.execute(
        text("""
            SELECT
                trang_thai,
                COUNT(*) AS total
            FROM lop_hoc
            GROUP BY trang_thai
        """)
    ).mappings().all()

    counts = {
        row["trang_thai"]: row["total"]
        for row in rows
    }

    statuses = [
        "Đang học",
        "Sắp mở",
        "Đã kết thúc",
    ]

    return [
        {
            "name": status,
            "value": counts.get(status, 0),
        }
        for status in statuses
    ]


@router.get("/ngon-ngu")
def get_course_languages(db: Session = Depends(get_db)):
    """
    Đếm khóa học theo ngôn ngữ.
    """
    rows = db.execute(
        text("""
            SELECT
                ngon_ngu AS name,
                COUNT(*) AS count
            FROM khoa_hoc
            GROUP BY ngon_ngu
            ORDER BY count DESC, ngon_ngu ASC
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("/lop-hoc")
def get_class_summary(db: Session = Depends(get_db)):
    """
    Bảng tổng hợp lớp học và sĩ số hiện tại.
    Chỉ tính học viên có trạng thái xếp lớp
    là 'Đang học'.
    """
    rows = db.execute(
        text("""
            SELECT
                l.ma_lop,
                l.ten_lop,
                k.ten_khoa_hoc AS khoa_hoc,
                COALESCE(
                    g.ho_ten,
                    'Chưa phân công'
                ) AS giao_vien,
                l.si_so_toi_da,
                l.trang_thai,
                COUNT(x.ma_hoc_vien) AS si_so
            FROM lop_hoc l
            JOIN khoa_hoc k
                ON k.ma_khoa_hoc = l.ma_khoa_hoc
            LEFT JOIN giao_vien g
                ON g.ma_giao_vien = l.ma_giao_vien
            LEFT JOIN xep_lop x
                ON x.ma_lop = l.ma_lop
                AND x.trang_thai = 'Đang học'
            GROUP BY
                l.ma_lop,
                l.ten_lop,
                k.ten_khoa_hoc,
                g.ho_ten,
                l.si_so_toi_da,
                l.trang_thai
            ORDER BY l.ma_lop ASC
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("")
def get_all_statistics(db: Session = Depends(get_db)):
    """
    Lấy toàn bộ dữ liệu thống kê trong một request.
    Frontend chỉ cần gọi /api/thong-ke.
    """
    return {
        "overview": get_overview(db),
        "classStatusData": get_class_status(db),
        "courseLanguageData": get_course_languages(db),
        "classData": get_class_summary(db),
    }
