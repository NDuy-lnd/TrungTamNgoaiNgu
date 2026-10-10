from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import HocVien

from schemas import HocVienResponse

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Language Center Management API"}

@app.get(
        "/hoc-vien",
        response_model=list[HocVienResponse]
)
def get_hoc_vien(db: Session = Depends(get_db)):
    return db.query(HocVien).all
