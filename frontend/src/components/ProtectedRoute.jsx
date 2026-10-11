
import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../contexts/AuthContext";

export const roleHome = {
  admin: "/",
  teacher: "/teacher",
  student: "/student",
};

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" description="Đang xác thực..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to={roleHome[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}
