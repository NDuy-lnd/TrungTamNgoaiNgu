
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import api from "../../services/api";

export default function RecoveryRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form] = Form.useForm();

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/api/auth/admin/recovery-requests"
      );
      setItems(response.data);
    } catch {
      setError("Không tải được danh sách yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResolve = async (values) => {
    if (!selected) return;

    setSaving(true);

    try {
      await api.put(
        `/api/auth/admin/recovery-requests/${selected.id}`,
        { mat_khau_moi: values.password }
      );

      message.success("Đặt lại mật khẩu thành công");
      setSelected(null);
      form.resetFields();
      await loadRequests();
    } catch (err) {
      message.error(
        err.response?.data?.detail ||
          "Không thể xử lý yêu cầu"
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Tên đăng nhập",
      dataIndex: "ten_dang_nhap",
    },
    {
      title: "Vai trò",
      dataIndex: "vai_tro",
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "ngay_yeu_cau",
      render: (value) =>
        value ? new Date(value).toLocaleString("vi-VN") : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (value) => <Tag color="orange">{value}</Tag>,
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Button
          type="primary"
          disabled={record.ten_dang_nhap === "admin"}
          onClick={() => setSelected(record)}
        >
          Xử lý
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Yêu cầu khôi phục mật khẩu
        </Typography.Title>

        <Button onClick={loadRequests}>
          Làm mới
        </Button>
      </Space>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
      />

      <Modal
        title={`Đặt lại mật khẩu: ${
          selected?.ten_dang_nhap || ""
        }`}
        open={Boolean(selected)}
        onCancel={() => {
          setSelected(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Xác nhận"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleResolve}
        >
          <Form.Item
            name="password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Nhập mật khẩu mới" },
              { min: 8, message: "Tối thiểu 8 ký tự" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Xác nhận mật khẩu"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("password") === value
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
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
