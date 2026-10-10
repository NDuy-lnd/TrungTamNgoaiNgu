
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const roleHome = {
  admin: "/",
  teacher: "/teacher",
  student: "/student"
};

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

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
