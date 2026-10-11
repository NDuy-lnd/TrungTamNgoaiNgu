
import { useState } from "react";
import {
  useNavigate,
  Navigate,
  Link,
} from "react-router-dom";

import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
} from "antd";

import {
  UserOutlined,
  LockOutlined,
  BookOutlined,
} from "@ant-design/icons";

import { useAuth } from "../contexts/AuthContext";
import { roleHome } from "../components/ProtectedRoute";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoginError("");
    setLoading(true);

    try {
      const loggedInUser = await login(
        values.username,
        values.password
      );

      const destination =
        roleHome[loggedInUser.role] || "/";

      navigate(destination, { replace: true });
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setLoginError(
          "Tên đăng nhập hoặc mật khẩu không chính xác!"
        );
      } else if (status === 403) {
        setLoginError(
          "Tài khoản của bạn đã bị khóa!"
        );
      } else {
        setLoginError(
          "Không thể đăng nhập. Vui lòng thử lại sau."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Navigate
        to={roleHome[user.role] || "/"}
        replace
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 16,
          boxShadow: "0 16px 50px rgba(0,0,0,0.2)",
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              margin: "0 auto 16px",
              borderRadius: 18,
              background: "#e6f4ff",
              color: "#1677ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            <BookOutlined />
          </div>

          <Typography.Title level={3}>
            Trung tâm Ngoại ngữ
          </Typography.Title>

          <Typography.Text type="secondary">
            Đăng nhập hệ thống quản lý
          </Typography.Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleLogin}
          onValuesChange={() => setLoginError("")}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên đăng nhập!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên đăng nhập"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          {loginError && (
            <Alert
              type="error"
              showIcon
              message={loginError}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44 }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Link to="/forgot-password">
              Quên mật khẩu?
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
