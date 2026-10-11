
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    Typography,
} from "antd";

import api from "../services/api";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const checkEmail = async (values) => {
        setLoading(true);
        setError("");

        try {
            await api.post("/api/auth/forgot-password", {
                email: values.email,
            });

            setEmail(values.email.trim());
            setStep(2);
        } catch (err) {
            const detail = err.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."
            );
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (values) => {
        setLoading(true);
        setError("");

        try {
            await api.post("/api/auth/email-change-password", {
                email,
                mat_khau_cu: values.oldPassword,
                mat_khau_moi: values.newPassword,
            });

            setSuccess("Đổi mật khẩu thành công!");
            setStep(3);
        } catch (err) {
  console.log(
    "Chi tiết lỗi Backend:",
    JSON.stringify(err.response?.data, null, 2)
  );

  const detail = err.response?.data?.detail;

  setError(
    Array.isArray(detail)
      ? detail.map((item) =>
          `${item.loc?.join(".")}: ${item.msg}`
        ).join("; ")
      : typeof detail === "string"
        ? detail
        : "Không thể đổi mật khẩu."
  );
} finally {
  setLoading(false);
}
};

return (
    <div
        style={{
            minHeight: "100vh",
            background:
                "linear-gradient(135deg, #0f172a, #1d4ed8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        }}
    >
        <Card
            style={{
                width: "100%",
                maxWidth: 440,
                borderRadius: 16,
            }}
        >
            <Typography.Title level={3}>
                {step === 1
                    ? "Quên mật khẩu"
                    : step === 2
                        ? "Đổi mật khẩu"
                        : "Hoàn tất"}
            </Typography.Title>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message={error}
                    style={{ marginBottom: 16 }}
                />
            )}

            {step === 1 && (
                <>
                    <Typography.Paragraph type="secondary">
                        Nhập email đã đăng ký để tìm tài khoản.
                    </Typography.Paragraph>

                    <Form layout="vertical" onFinish={checkEmail}>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập email",
                                },
                                {
                                    type: "email",
                                    message: "Email không hợp lệ",
                                },
                            ]}
                        >
                            <Input
                                size="large"
                                placeholder="example@gmail.com"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Tiếp tục
                        </Button>
                    </Form>
                </>
            )}

            {step === 2 && (
                <>
                    <Typography.Paragraph>
                        Email: <strong>{email}</strong>
                    </Typography.Paragraph>

                    <Form
                        layout="vertical"
                        onFinish={changePassword}
                    >

                        <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                                {
                                    required: true,
                                    message: "Nhập mật khẩu mới",
                                },
                                {
                                    min: 8,
                                    message: "Tối thiểu 8 ký tự",
                                },
                            ]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            dependencies={["newPassword"]}
                            rules={[
                                {
                                    required: true,
                                    message: "Nhập lại mật khẩu",
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (
                                            !value ||
                                            getFieldValue("newPassword") === value
                                        ) {
                                            return Promise.resolve();
                                        }

                                        return Promise.reject(
                                            new Error("Mật khẩu không khớp")
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Xác nhận đổi mật khẩu
                        </Button>
                    </Form>


                </>
            )}

            {step === 3 && (
                <Alert
                    type="success"
                    showIcon
                    message={success}
                />
            )}

            <div
                style={{
                    textAlign: "center",
                    marginTop: 20,
                }}
            >
                <Link to="/login">
                    Quay lại đăng nhập
                </Link>
            </div>
        </Card>
    </div>
);
}
