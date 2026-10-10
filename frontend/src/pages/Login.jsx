
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Space
} from "antd";

import {
  UserOutlined,
  LockOutlined,
  BookOutlined
} from "@ant-design/icons";

import { useAuth } from "../contexts/AuthContext";
import { roleHome } from "../components/ProtectedRoute";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate
        to={roleHome[user.role] || "/"}
        replace
      />
    );
  }

  const handleLogin = async (values) => {
    setError("");
    setLoading(true);

    try {
      const result = login(
        values.username,
        values.password
      );

      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate(roleHome[result.user.role], {
        replace: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
        padding: 20
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 16,
          boxShadow: "0 16px 50px rgba(0,0,0,0.2)"
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28
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
              fontSize: 32
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

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên đăng nhập!"
              }
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
                message: "Vui lòng nhập mật khẩu!"
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

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
        </Form>

        <Card
          size="small"
          style={{
            marginTop: 20,
            background: "#f8fafc"
          }}
        >
          <Typography.Text strong>
            Tài khoản dùng thử
          </Typography.Text>

          <div style={{ marginTop: 10 }}>
            <Space direction="vertical" size={4}>
              <Typography.Text>
                Admin: <code>admin</code>
              </Typography.Text>
              <Typography.Text>
                Giáo viên: <code>giaovien</code>
              </Typography.Text>
              <Typography.Text>
                Học viên: <code>hocvien</code>
              </Typography.Text>
              <Typography.Text type="secondary">
                Mật khẩu chung: <code>123456</code>
              </Typography.Text>
            </Space>
          </div>
        </Card>
      </Card>
    </div>
  );
}
