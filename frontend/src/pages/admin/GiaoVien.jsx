
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  Typography,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Descriptions,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
} from "antd";

import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import giaoVienService from "../../services/giaoVienService";


function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền quản lý giáo viên.";
  }

  return "Không thể kết nối đến máy chủ.";
}


export default function GiaoVien() {
  const [teachers, setTeachers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();


  // Lấy danh sách và thống kê từ MySQL
  const fetchTeachers = useCallback(async () => {
    setLoading(true);

    try {
      const data = await giaoVienService.getAll({
        search: searchText.trim(),
        status:
          filterStatus === "all"
            ? undefined
            : filterStatus === "active",
        page,
        page_size: pageSize,
      });

      setTeachers(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || {
        total: 0,
        active: 0,
        inactive: 0,
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [searchText, filterStatus, page, pageSize, messageApi]);


  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);


  // Mở form thêm
  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    form.setFieldsValue({ trang_thai: true });
    setIsModalOpen(true);
  };


  // Mở form sửa
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    form.resetFields();

    form.setFieldsValue({
      ho_ten: teacher.ho_ten,
      ngay_sinh: teacher.ngay_sinh,
      gioi_tinh: teacher.gioi_tinh,
      email: teacher.email,
      so_dien_thoai: teacher.so_dien_thoai,
      chuyen_mon: teacher.chuyen_mon,
      trang_thai: teacher.trang_thai,
    });

    setIsModalOpen(true);
  };


  // Lưu giáo viên vào MySQL
  const handleSave = async () => {
    let values;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ho_ten: values.ho_ten.trim(),
        ngay_sinh: values.ngay_sinh || null,
        gioi_tinh: values.gioi_tinh || null,
        email: values.email?.trim() || null,
        so_dien_thoai: values.so_dien_thoai?.trim() || null,
        chuyen_mon: values.chuyen_mon?.trim() || null,
        trang_thai: values.trang_thai,
      };

      if (editingTeacher) {
        await giaoVienService.update(
          editingTeacher.ma_giao_vien,
          payload
        );

        messageApi.success("Cập nhật giáo viên thành công!");
      } else {
        await giaoVienService.create({
          ...payload,
          ten_dang_nhap: values.ten_dang_nhap.trim(),
          mat_khau: values.mat_khau,
        });

        messageApi.success("Thêm giáo viên thành công!");
      }

      setIsModalOpen(false);
      setEditingTeacher(null);
      form.resetFields();

      if (!editingTeacher && page !== 1) {
        setPage(1);
      } else {
        await fetchTeachers();
      }
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };


  // Khóa hoặc mở lại tài khoản
  const handleChangeStatus = async (teacher) => {
    const newStatus = !teacher.trang_thai;

    try {
      await giaoVienService.changeStatus(
        teacher.ma_giao_vien,
        newStatus
      );

      messageApi.success(
        newStatus
          ? "Đã mở lại tài khoản giáo viên!"
          : "Đã khóa tài khoản giáo viên!"
      );

      await fetchTeachers();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };


  const columns = [
    {
      title: "Mã GV",
      dataIndex: "ma_giao_vien",
      width: 85,
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Giới tính",
      dataIndex: "gioi_tinh",
      width: 95,
      render: (value) => value || "—",
    },
    {
      title: "Chuyên môn",
      dataIndex: "chuyen_mon",
      render: (value) =>
        value ? <Tag color="blue">{value}</Tag> : "—",
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (value) => value || "—",
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai",
      render: (value) => value || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Đang làm việc" : "Ngừng làm việc"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => setViewingTeacher(record)}
            title="Xem chi tiết"
          />

          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Chỉnh sửa"
          />

          <Popconfirm
            title={
              record.trang_thai
                ? "Khóa tài khoản giáo viên?"
                : "Mở lại tài khoản giáo viên?"
            }
            description={
              record.trang_thai
                ? "Giáo viên sẽ không thể đăng nhập."
                : "Giáo viên sẽ có thể đăng nhập trở lại."
            }
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => handleChangeStatus(record)}
          >
            <Button
              danger={record.trang_thai}
              icon={
                record.trang_thai
                  ? <LockOutlined />
                  : <UnlockOutlined />
              }
              title={
                record.trang_thai
                  ? "Khóa tài khoản"
                  : "Mở tài khoản"
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];


  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ marginBottom: 4 }}
        >
          Quản lý giáo viên
        </Typography.Title>

        <Typography.Text type="secondary">
          Theo dõi và quản lý đội ngũ giáo viên của trung tâm
        </Typography.Text>
      </div>

      {/* Thẻ thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng giáo viên"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Đang làm việc"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Ngừng làm việc"
              value={stats.inactive}
              prefix={<StopOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách */}
      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Space wrap>
            <Input
              placeholder="Tìm tên, email, chuyên môn..."
              prefix={<SearchOutlined />}
              style={{ width: 290 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              allowClear
            />

            <Select
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value);
                setPage(1);
              }}
              style={{ width: 170 }}
              options={[
                {
                  value: "all",
                  label: "Tất cả trạng thái",
                },
                {
                  value: "active",
                  label: "Đang làm việc",
                },
                {
                  value: "inactive",
                  label: "Ngừng làm việc",
                },
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTeachers}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm giáo viên
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="ma_giao_vien"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (count) => `Tổng ${count} giáo viên`,
            onChange: setPage,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* Form thêm và sửa */}
      <Modal
        title={
          editingTeacher
            ? "Cập nhật thông tin giáo viên"
            : "Thêm giáo viên mới"
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
          form.resetFields();
        }}
        okText="Lưu thông tin"
        cancelText="Hủy"
        confirmLoading={saving}
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={{ trang_thai: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="ho_ten"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập họ tên",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập họ tên"
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Giới tính"
                name="gioi_tinh"
                rules={[
                  {
                    required: true,
                    message: "Chọn giới tính",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn giới tính"
                  options={[
                    { value: "Nam", label: "Nam" },
                    { value: "Nữ", label: "Nữ" },
                    { value: "Khác", label: "Khác" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Ngày sinh"
                name="ngay_sinh"
                rules={[
                  {
                    pattern: /^\d{4}-\d{2}-\d{2}$/,
                    message: "Nhập theo dạng YYYY-MM-DD",
                  },
                ]}
              >
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Số điện thoại"
                name="so_dien_thoai"
                rules={[
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Nhập 10–11 chữ số",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  {
                    type: "email",
                    message: "Email không hợp lệ",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập email"
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Chuyên môn"
                name="chuyen_mon"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Nhập chuyên môn",
                  },
                ]}
              >
                <Input
                  placeholder="Ví dụ: IELTS, TOEIC..."
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            {!editingTeacher && (
              <>
                <Col span={12}>
                  <Form.Item
                    label="Tên đăng nhập"
                    name="ten_dang_nhap"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Nhập tên đăng nhập",
                      },
                      {
                        min: 3,
                        message: "Tối thiểu 3 ký tự",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Ví dụ: GV011"
                      maxLength={50}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Mật khẩu"
                    name="mat_khau"
                    rules={[
                      {
                        required: true,
                        message: "Nhập mật khẩu",
                      },
                      {
                        min: 8,
                        message: "Tối thiểu 8 ký tự",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder="Tối thiểu 8 ký tự"
                      maxLength={128}
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col span={24}>
              <Form.Item
                label="Trạng thái"
                name="trang_thai"
                rules={[
                  {
                    required: true,
                    message: "Chọn trạng thái",
                  },
                ]}
              >
                <Select
                  options={[
                    {
                      value: true,
                      label: "Đang làm việc",
                    },
                    {
                      value: false,
                      label: "Ngừng làm việc",
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Xem chi tiết */}
      <Modal
        title="Thông tin chi tiết giáo viên"
        open={!!viewingTeacher}
        onCancel={() => setViewingTeacher(null)}
        footer={[
          <Button
            key="close"
            onClick={() => setViewingTeacher(null)}
          >
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {viewingTeacher && (
          <Descriptions
            bordered
            column={1}
            size="small"
            style={{ marginTop: 20 }}
            items={[
              {
                key: "1",
                label: "Mã giáo viên",
                children: viewingTeacher.ma_giao_vien,
              },
              {
                key: "2",
                label: "Họ và tên",
                children: viewingTeacher.ho_ten,
              },
              {
                key: "3",
                label: "Tên đăng nhập",
                children: viewingTeacher.ten_dang_nhap,
              },
              {
                key: "4",
                label: "Ngày sinh",
                children: viewingTeacher.ngay_sinh || "—",
              },
              {
                key: "5",
                label: "Giới tính",
                children: viewingTeacher.gioi_tinh || "—",
              },
              {
                key: "6",
                label: "Email",
                children: viewingTeacher.email || "—",
              },
              {
                key: "7",
                label: "Số điện thoại",
                children: viewingTeacher.so_dien_thoai || "—",
              },
              {
                key: "8",
                label: "Chuyên môn",
                children: viewingTeacher.chuyen_mon || "—",
              },
              {
                key: "9",
                label: "Trạng thái",
                children: (
                  <Tag
                    color={
                      viewingTeacher.trang_thai
                        ? "green"
                        : "red"
                    }
                  >
                    {viewingTeacher.trang_thai
                      ? "Đang làm việc"
                      : "Ngừng làm việc"}
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
