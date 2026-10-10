
export const studentProfile = {
  ma_hoc_vien: 1,
  ho_ten: "Nguyễn Văn An",
  email: "an@example.com",
  so_dien_thoai: "0912345678",
};

export const studentClasses = [
  {
    ma_lop: 1,
    ma_xep_lop: 101,
    ten_lop: "Giao tiếp A01",
    ten_khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    giao_vien: "Nguyễn Văn Minh",
    ngay_bat_dau: "2026-09-01",
    ngay_ket_thuc: "2026-12-01",
    trang_thai: "Đang học",
    si_so: 12,
    si_so_toi_da: 20,
    mo_ta: "Rèn luyện nghe, nói và giao tiếp tiếng Anh hằng ngày.",
  },
  {
    ma_lop: 2,
    ma_xep_lop: 202,
    ten_lop: "IELTS 5.5 - A01",
    ten_khoa_hoc: "Luyện thi IELTS 5.5",
    giao_vien: "Nguyễn Văn Minh",
    ngay_bat_dau: "2026-09-15",
    ngay_ket_thuc: "2027-01-15",
    trang_thai: "Đang học",
    si_so: 15,
    si_so_toi_da: 20,
    mo_ta: "Luyện bốn kỹ năng Listening, Reading, Writing, Speaking.",
  },
];

export const studentSchedules = [
  { ma_lich: 1, ma_lop: 1, thu: "Thứ 2", gio_bat_dau: "18:00", gio_ket_thuc: "20:00", phong_hoc: "P101" },
  { ma_lich: 2, ma_lop: 2, thu: "Thứ 3", gio_bat_dau: "18:00", gio_ket_thuc: "20:00", phong_hoc: "P102" },
  { ma_lich: 3, ma_lop: 1, thu: "Thứ 4", gio_bat_dau: "18:00", gio_ket_thuc: "20:00", phong_hoc: "P101" },
  { ma_lich: 4, ma_lop: 2, thu: "Thứ 5", gio_bat_dau: "18:00", gio_ket_thuc: "20:00", phong_hoc: "P102" },
];

export const studentAttendance = [
  { ma_diem_danh: 1, ma_xep_lop: 101, ngay_hoc: "2026-09-28", trang_thai: "Có mặt", ghi_chu: "" },
  { ma_diem_danh: 2, ma_xep_lop: 101, ngay_hoc: "2026-09-30", trang_thai: "Vắng mặt", ghi_chu: "Nghỉ có báo trước" },
  { ma_diem_danh: 3, ma_xep_lop: 101, ngay_hoc: "2026-10-05", trang_thai: "Có mặt", ghi_chu: "" },
  { ma_diem_danh: 4, ma_xep_lop: 101, ngay_hoc: "2026-10-07", trang_thai: "Có mặt", ghi_chu: "" },
  { ma_diem_danh: 5, ma_xep_lop: 202, ngay_hoc: "2026-09-29", trang_thai: "Có mặt", ghi_chu: "" },
  { ma_diem_danh: 6, ma_xep_lop: 202, ngay_hoc: "2026-10-01", trang_thai: "Có mặt", ghi_chu: "" },
  { ma_diem_danh: 7, ma_xep_lop: 202, ngay_hoc: "2026-10-06", trang_thai: "Vắng mặt", ghi_chu: "" },
  { ma_diem_danh: 8, ma_xep_lop: 202, ngay_hoc: "2026-10-08", trang_thai: "Có mặt", ghi_chu: "" },
];

export const studentGrades = [
  { ma_diem: 1, ma_xep_lop: 101, diem_tong_ket: 8.5 },
  { ma_diem: 2, ma_xep_lop: 202, diem_tong_ket: null },
];

export const studentDocuments = [
  {
    ma_tai_lieu: 1,
    ma_lop: 1,
    ten_tai_lieu: "Từ vựng giao tiếp cơ bản",
    duong_dan_file: "https://example.com/giao-tiep.pdf",
    ngay_dang: "2026-09-20",
    mo_ta: "Tổng hợp từ vựng và mẫu câu giao tiếp.",
  },
  {
    ma_tai_lieu: 2,
    ma_lop: 1,
    ten_tai_lieu: "Bài tập luyện hội thoại",
    duong_dan_file: "https://example.com/hoi-thoai.pdf",
    ngay_dang: "2026-09-25",
    mo_ta: "Bài tập thực hành theo chủ đề.",
  },
  {
    ma_tai_lieu: 3,
    ma_lop: 2,
    ten_tai_lieu: "IELTS Speaking Practice",
    duong_dan_file: "https://example.com/ielts-speaking.pdf",
    ngay_dang: "2026-10-01",
    mo_ta: "Các chủ đề luyện nói IELTS.",
  },
];

export const weekDays = [
  "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5",
  "Thứ 6", "Thứ 7", "Chủ nhật",
];

export function getStudentClass(maLop) {
  return studentClasses.find((item) => item.ma_lop === maLop);
}

export function getClassByEnrollment(maXepLop) {
  return studentClasses.find(
    (item) => item.ma_xep_lop === maXepLop
  );
}

export function getGradeResult(score) {
  if (score === null || score === undefined) {
    return { label: "Chưa có điểm", color: "default" };
  }
  return score >= 5
    ? { label: "Đạt", color: "success" }
    : { label: "Chưa đạt", color: "error" };
}

export function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
