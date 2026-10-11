
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "ttnn_access_token";

const roleMap = {
  "Quản trị viên": "admin",
  "Giáo viên": "teacher",
  "Học viên": "student",
};

function normalizeUser(data) {
  return {
    ...data,
    id: data.ma_tai_khoan,
    name: data.ho_ten || data.ten_dang_nhap,
    role: roleMap[data.vai_tro],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/auth/me");

        if (active) {
          setUser(normalizeUser(response.data));
        }
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(username, password) {
    const response = await api.post("/api/auth/login", {
      ten_dang_nhap: username,
      mat_khau: password,
    });

    const { access_token, user: account } = response.data;

    const normalizedUser = normalizeUser(account);

    if (!normalizedUser.role) {
      throw new Error("Vai trò tài khoản không hợp lệ");
    }

    sessionStorage.setItem(TOKEN_KEY, access_token);
    setUser(normalizedUser);

    return normalizedUser;
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth phải được sử dụng bên trong AuthProvider"
    );
  }

  return context;
}
