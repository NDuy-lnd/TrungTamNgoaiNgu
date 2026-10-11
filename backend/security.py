
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from database import get_db
from models import TaiKhoan

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "Cần cấu hình JWT_SECRET_KEY tối thiểu 32 ký tự trong .env"
    )

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 120

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer()


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    try:
        return password_hash.verify(password, hashed_password)
    except Exception:
        return False


def create_access_token(account_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(account_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db)
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        account_id = int(payload["sub"])
    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise unauthorized

    account = db.query(TaiKhoan).filter(
        TaiKhoan.ma_tai_khoan == account_id
    ).first()

    if not account or not account.trang_thai:
        raise unauthorized

    return account


def require_roles(*allowed_roles):
    def check_role(
        account: TaiKhoan = Depends(get_current_user)
    ):
        if account.vai_tro not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền truy cập"
            )

        return account

    return check_role
