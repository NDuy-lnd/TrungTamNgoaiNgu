
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const accounts = [
  {
    username: "admin",
    password: "123456",
    role: "admin",
    name: "Quản trị viên"
  },
  {
    username: "giaovien",
    password: "123456",
    role: "teacher",
    name: "Nguyễn Văn Minh"
  },
  {
    username: "hocvien",
    password: "123456",
    role: "student",
    name: "Học viên mẫu"
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("ttnn_demo_user")
      );
    } catch {
      return null;
    }
  });

  const login = (username, password) => {
    const account = accounts.find(
      (a) =>
        a.username === username.trim() &&
        a.password === password
    );

    if (!account) {
      return {
        success: false,
        message: "Sai tên đăng nhập hoặc mật khẩu!"
      };
    }

    const loggedInUser = {
      username: account.username,
      role: account.role,
      name: account.name
    };

    sessionStorage.setItem(
      "ttnn_demo_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return {
      success: true,
      user: loggedInUser
    };
  };

  const logout = () => {
    sessionStorage.removeItem("ttnn_demo_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("AuthProvider chưa được khai báo");
  }

  return context;
}
