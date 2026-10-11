
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./components/AdminLayout";
import TeacherLayout from "./components/TeacherLayout";
import StudentLayout from "./components/StudentLayout";

import Login from "./pages/Login";


// Admin
import Dashboard from "./pages/admin/Dashboard";
import HocVien from "./pages/admin/HocVien";
import GiaoVien from "./pages/admin/GiaoVien";
import KhoaHoc from "./pages/admin/KhoaHoc";
import LopHoc from "./pages/admin/LopHoc";
import LichHoc from "./pages/admin/LichHoc";
import ThongKe from "./pages/admin/ThongKe";
import RecoveryRequests from "./pages/admin/RecoveryRequests";

// Giáo viên
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import Attendance from "./pages/teacher/Attendance";
import Grades from "./pages/teacher/Grades";
import TeacherDocuments from "./pages/teacher/TeacherDocuments";

// Các trang Học viên
import StudentHome from "./pages/student/StudentHome";
import StudentClasses from "./pages/student/StudentClasses";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentGrades from "./pages/student/StudentGrades";
import StudentDocuments from "./pages/student/StudentDocuments";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Trang đăng nhập */}
          <Route path="/login" element={<Login />} />

          {/* Khu vực Admin */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin"]} />
            }
          >
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="hoc-vien" element={<HocVien />} />
              <Route path="giao-vien" element={<GiaoVien />} />
              <Route
                path="/yeu-cau-khoi-phuc"
                element={<RecoveryRequests />}
              />
              <Route path="khoa-hoc" element={<KhoaHoc />} />
              <Route path="lop-hoc" element={<LopHoc />} />
              <Route path="lich-hoc" element={<LichHoc />} />
              <Route path="thong-ke" element={<ThongKe />} />

            </Route>
          </Route>

          {/* Khu vực Giáo viên */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["teacher"]} />
            }
          >
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherHome />} />
              <Route path="lop-hoc" element={<TeacherClasses />} />
              <Route path="lich-day" element={<TeacherSchedule />} />
              <Route path="diem-danh" element={<Attendance />} />
              <Route path="diem" element={<Grades />} />
              <Route path="tai-lieu" element={<TeacherDocuments />} />
            </Route>
          </Route>

          {/* Khu vực Học viên */}
          {/* HỌC VIÊN */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentHome />} />
              <Route path="lop-hoc" element={<StudentClasses />} />
              <Route path="lich-hoc" element={<StudentSchedule />} />
              <Route path="diem-danh" element={<StudentAttendance />} />
              <Route path="ket-qua" element={<StudentGrades />} />
              <Route path="tai-lieu" element={<StudentDocuments />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
