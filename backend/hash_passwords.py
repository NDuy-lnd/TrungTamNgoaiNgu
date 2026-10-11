
from sqlalchemy import func
from database import SessionLocal
from models import TaiKhoan
from security import hash_password

db = SessionLocal()

try:
    accounts = db.query(TaiKhoan).all()

    print(f"Tìm thấy {len(accounts)} tài khoản.")

    # Chỉ xử lý dữ liệu mẫu đã xác nhận.
    for account in accounts:
        current_password = account.mat_khau

        if current_password.startswith(("$argon2", "$2a$", "$2b$", "$2y$")):
            print(f"Bỏ qua tài khoản đã băm: {account.ten_dang_nhap}")
            continue

        if len(current_password) != 6:
            raise ValueError(
                f"Tài khoản {account.ten_dang_nhap} có "
                "định dạng mật khẩu khác dự kiến."
            )

        account.mat_khau = hash_password(current_password)

    db.commit()
    print("Đã chuyển đổi mật khẩu sang Argon2 thành công!")

except Exception as error:
    db.rollback()
    print(f"Lỗi: {error}")

finally:
    db.close()
