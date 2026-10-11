from sqlalchemy import text, bindparam
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from security import require_roles


router = APIRouter(
    prefix="/api/lop-hoc",
    tags=["Quản lý lớp học"],
    dependencies=[Depends(require_roles("Quản trị viên"))],
)

TRANG_THAI_LOP = ("Sắp mở", "Đang học", "Đã kết thúc")


class LopHocData(BaseModel):
    ten_lop: str = Field(min_length=1, max_length=100)
    ma_khoa_hoc: int
    ma_giao_vien: Optional[int] = None
    si_so_toi_da: int = Field(ge=1, le=100)
    ngay_bat_dau: date
    ngay_ket_thuc: date
    trang_thai: str = "Sắp mở"

    @model_validator(mode="after")
    def validate_class(self):
        self.ten_lop = self.ten_lop.strip()
        if not self.ten_lop:
            raise ValueError("Tên lớp không được để trống")
        if self.ngay_ket_thuc < self.ngay_bat_dau:
            raise ValueError("Ngày kết thúc phải từ ngày bắt đầu trở đi")
        if self.trang_thai not in TRANG_THAI_LOP:
            raise ValueError("Trạng thái lớp không hợp lệ")
        return self


class XepLopData(BaseModel):
    ma_hoc_vien: list[int]


CLASS_SELECT = """
SELECT
    l.ma_lop,
    l.ten_lop,
    l.ma_khoa_hoc,
    k.ten_khoa_hoc,
    l.ma_giao_vien,
    g.ho_ten AS ten_giao_vien,
    l.si_so_toi_da,
    l.ngay_bat_dau,
    l.ngay_ket_thuc,
    l.trang_thai,
    (
        SELECT COUNT(*)
        FROM xep_lop x
        WHERE x.ma_lop = l.ma_lop
          AND x.trang_thai = 'Đang học'
    ) AS si_so_hien_tai
FROM lop_hoc l
JOIN khoa_hoc k ON k.ma_khoa_hoc = l.ma_khoa_hoc
LEFT JOIN giao_vien g ON g.ma_giao_vien = l.ma_giao_vien
"""


def serialize(row):
    result = dict(row)
    for field in ("ngay_bat_dau", "ngay_ket_thuc"):
        if result[field] is not None:
            result[field] = result[field].isoformat()
    return result


def find_class(db, class_id, lock=False):
    sql = CLASS_SELECT + " WHERE l.ma_lop = :id"
    # Khóa hàng của lớp khi cần thay đổi sĩ số/xếp lớp.
    # FOR UPDATE áp dụng riêng cho bảng lop_hoc.
    if lock:
        db.execute(
            text("SELECT ma_lop FROM lop_hoc WHERE ma_lop=:id FOR UPDATE"),
            {"id": class_id},
        ).first()

    row = db.execute(
        text(sql), {"id": class_id}
    ).mappings().first()

    if not row:
        raise HTTPException(404, "Không tìm thấy lớp học")
    return row


def check_references(db, data):
    course = db.execute(
        text("""
            SELECT ma_khoa_hoc, trang_thai
            FROM khoa_hoc
            WHERE ma_khoa_hoc=:id
        """),
        {"id": data.ma_khoa_hoc},
    ).mappings().first()

    if not course:
        raise HTTPException(400, "Khóa học không tồn tại")

    if data.ma_giao_vien is not None:
        teacher = db.execute(
            text("""
                SELECT ma_giao_vien, trang_thai
                FROM giao_vien
                WHERE ma_giao_vien=:id
            """),
            {"id": data.ma_giao_vien},
        ).mappings().first()

        if not teacher:
            raise HTTPException(400, "Giáo viên không tồn tại")


def params_from(data):
    return {
        "ten_lop": data.ten_lop,
        "ma_khoa_hoc": data.ma_khoa_hoc,
        "ma_giao_vien": data.ma_giao_vien,
        "si_so_toi_da": data.si_so_toi_da,
        "ngay_bat_dau": data.ngay_bat_dau,
        "ngay_ket_thuc": data.ngay_ket_thuc,
        "trang_thai": data.trang_thai,
    }


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    courses = db.execute(
        text("""
            SELECT ma_khoa_hoc, ten_khoa_hoc, trang_thai
            FROM khoa_hoc
            ORDER BY ma_khoa_hoc ASC
        """)
    ).mappings().all()

    teachers = db.execute(
        text("""
            SELECT ma_giao_vien, ho_ten, trang_thai
            FROM giao_vien
            ORDER BY ma_giao_vien ASC
        """)
    ).mappings().all()

    students = db.execute(
        text("""
            SELECT ma_hoc_vien, ho_ten, trang_thai
            FROM hoc_vien
            ORDER BY ma_hoc_vien ASC
        """)
    ).mappings().all()

    return {
        "courses": [dict(x) for x in courses],
        "teachers": [dict(x) for x in teachers],
        "students": [dict(x) for x in students],
    }


@router.get("")
def list_classes(
    search: str = "",
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(7, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if status and status not in TRANG_THAI_LOP:
        raise HTTPException(400, "Trạng thái không hợp lệ")

    where = """
    WHERE (
        :empty_search = 1
        OR l.ten_lop LIKE :keyword
        OR k.ten_khoa_hoc LIKE :keyword
        OR g.ho_ten LIKE :keyword
        OR CAST(l.ma_lop AS CHAR) LIKE :keyword
    )
    AND (:all_status = 1 OR l.trang_thai = :status)
    """

    params = {
        "empty_search": int(not search.strip()),
        "keyword": f"%{search.strip()}%",
        "all_status": int(status is None),
        "status": status or "",
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }

    join_sql = """
    FROM lop_hoc l
    JOIN khoa_hoc k ON k.ma_khoa_hoc = l.ma_khoa_hoc
    LEFT JOIN giao_vien g ON g.ma_giao_vien = l.ma_giao_vien
    """

    rows = db.execute(
        text(
            CLASS_SELECT + where +
            " ORDER BY l.ma_lop ASC LIMIT :limit OFFSET :offset"
        ),
        params,
    ).mappings().all()

    total = db.execute(
        text("SELECT COUNT(*) " + join_sql + where),
        params,
    ).scalar_one()

    stats = db.execute(
        text("""
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(trang_thai='Đang học'),0) AS active,
                COALESCE(SUM(trang_thai='Sắp mở'),0) AS upcoming,
                COALESCE(SUM(trang_thai='Đã kết thúc'),0) AS finished
            FROM lop_hoc
        """)
    ).mappings().one()

    return {
        "items": [serialize(x) for x in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "stats": dict(stats),
    }


@router.get("/{class_id}")
def class_detail(
    class_id: int,
    db: Session = Depends(get_db),
):
    return serialize(find_class(db, class_id))


@router.post("", status_code=201)
def create_class(
    data: LopHocData,
    db: Session = Depends(get_db),
):
    check_references(db, data)

    try:
        result = db.execute(
            text("""
                INSERT INTO lop_hoc (
                    ten_lop, ma_khoa_hoc, ma_giao_vien,
                    si_so_toi_da, ngay_bat_dau,
                    ngay_ket_thuc, trang_thai
                )
                VALUES (
                    :ten_lop, :ma_khoa_hoc, :ma_giao_vien,
                    :si_so_toi_da, :ngay_bat_dau,
                    :ngay_ket_thuc, :trang_thai
                )
            """),
            params_from(data),
        )
        class_id = result.lastrowid
        db.commit()
        return serialize(find_class(db, class_id))

    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Dữ liệu lớp học không hợp lệ")
    except Exception:
        db.rollback()
        raise


@router.put("/{class_id}")
def update_class(
    class_id: int,
    data: LopHocData,
    db: Session = Depends(get_db),
):
    try:
        current = find_class(db, class_id, lock=True)
        check_references(db, data)

        if data.si_so_toi_da < current["si_so_hien_tai"]:
            raise HTTPException(
                400,
                "Sĩ số tối đa nhỏ hơn số học viên đang học",
            )

        params = params_from(data)
        params["id"] = class_id

        db.execute(
            text("""
                UPDATE lop_hoc SET
                    ten_lop=:ten_lop,
                    ma_khoa_hoc=:ma_khoa_hoc,
                    ma_giao_vien=:ma_giao_vien,
                    si_so_toi_da=:si_so_toi_da,
                    ngay_bat_dau=:ngay_bat_dau,
                    ngay_ket_thuc=:ngay_ket_thuc,
                    trang_thai=:trang_thai
                WHERE ma_lop=:id
            """),
            params,
        )

        db.commit()
        return serialize(find_class(db, class_id))

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Dữ liệu lớp học không hợp lệ")
    except Exception:
        db.rollback()
        raise


@router.get("/{class_id}/hoc-vien")
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
):
    find_class(db, class_id)

    rows = db.execute(
        text("""
            SELECT
                x.ma_hoc_vien,
                h.ho_ten,
                x.ngay_xep,
                x.trang_thai
            FROM xep_lop x
            JOIN hoc_vien h ON h.ma_hoc_vien=x.ma_hoc_vien
            WHERE x.ma_lop=:id
            ORDER BY h.ma_hoc_vien ASC
        """),
        {"id": class_id},
    ).mappings().all()

    return [
        {
            **dict(x),
            "ngay_xep": x["ngay_xep"].isoformat(),
        }
        for x in rows
    ]


@router.put("/{class_id}/hoc-vien")
def save_class_students(
    class_id: int,
    data: XepLopData,
    db: Session = Depends(get_db),
):
    ids = data.ma_hoc_vien

    if len(ids) != len(set(ids)):
        raise HTTPException(400, "Danh sách học viên bị trùng")

    try:
        current = find_class(db, class_id, lock=True)

        if current["trang_thai"] == "Đã kết thúc":
            raise HTTPException(
                400, "Không thể xếp học viên vào lớp đã kết thúc"
            )

        if len(ids) > current["si_so_toi_da"]:
            raise HTTPException(400, "Vượt quá sĩ số tối đa")

        if ids:
            existing_students = db.execute(
                text("""
                    SELECT ma_hoc_vien
                    FROM hoc_vien
                    WHERE ma_hoc_vien IN :ids
                    AND trang_thai=1
                    """).bindparams(bindparam("ids", expanding=True)),
                {"ids": ids},
            ).scalars().all()

            if len(existing_students) != len(ids):
                raise HTTPException(
                    400,
                    "Có học viên không tồn tại hoặc đã bị khóa",
                )

        existing = db.execute(
            text("""
                SELECT ma_hoc_vien, trang_thai
                FROM xep_lop
                WHERE ma_lop=:id
            """),
            {"id": class_id},
        ).mappings().all()

        previous = {x["ma_hoc_vien"]: x["trang_thai"] for x in existing}
        chosen = set(ids)

        # Không xóa hồ sơ xếp lớp cũ; giữ lịch sử học tập.
        for student_id, old_status in previous.items():
            if old_status == "Đang học" and student_id not in chosen:
                db.execute(
                    text("""
                        UPDATE xep_lop
                        SET trang_thai='Đã rời lớp'
                        WHERE ma_lop=:class_id
                          AND ma_hoc_vien=:student_id
                    """),
                    {
                        "class_id": class_id,
                        "student_id": student_id,
                    },
                )

        for student_id in ids:
            if student_id in previous:
                if previous[student_id] != "Đang học":
                    db.execute(
                        text("""
                            UPDATE xep_lop
                            SET trang_thai='Đang học',
                                ngay_xep=CURRENT_DATE()
                            WHERE ma_lop=:class_id
                              AND ma_hoc_vien=:student_id
                        """),
                        {
                            "class_id": class_id,
                            "student_id": student_id,
                        },
                    )
            else:
                db.execute(
                    text("""
                        INSERT INTO xep_lop (
                            ma_hoc_vien, ma_lop,
                            ngay_xep, trang_thai
                        )
                        VALUES (
                            :student_id, :class_id,
                            CURRENT_DATE(), 'Đang học'
                        )
                    """),
                    {
                        "student_id": student_id,
                        "class_id": class_id,
                    },
                )

        db.commit()
        return {
            "message": "Cập nhật danh sách lớp thành công",
            "si_so_hien_tai": len(ids),
        }

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Không thể cập nhật xếp lớp")
    except Exception:
        db.rollback()
        raise


@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
):
    try:
        find_class(db, class_id, lock=True)

        # Không xóa lớp đã phát sinh dữ liệu nghiệp vụ.
        for table in ("xep_lop", "lich_hoc"):
            count = db.execute(
                text(f"SELECT COUNT(*) FROM {table} WHERE ma_lop=:id"),
                {"id": class_id},
            ).scalar_one()

            if count:
                raise HTTPException(
                    409,
                    "Lớp đã có học viên hoặc lịch học, không thể xóa",
                )

        db.execute(
            text("DELETE FROM lop_hoc WHERE ma_lop=:id"),
            {"id": class_id},
        )
        db.commit()
        return {"message": "Đã xóa lớp học"}

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Lớp đang được sử dụng, không thể xóa"
        )
    except Exception:
        db.rollback()
        raise
