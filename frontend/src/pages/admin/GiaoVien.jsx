
import { useState } from "react";
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
  DeleteOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";

// Dữ liệu mẫu, chưa kết nối MySQL
const initialTeachers = [
  {
    ma_giao_vien: 1,
    ho_ten: "Nguyễn Văn Minh",
    ngay_sinh: "1985-04-12",
    gioi_tinh: "Nam",
    email: "minh@gmail.com",
    so_dien_thoai: "0912345678",
    chuyen_mon: "Tiếng Anh",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 2,
    ho_ten: "Trần Thị Lan",
    ngay_sinh: "1990-08-20",
    gioi_tinh: "Nữ",
    email: "lan@gmail.com",
    so_dien_thoai: "0987654321",
    chuyen_mon: "Tiếng Trung",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 3,
    ho_ten: "Lê Quốc Huy",
    ngay_sinh: "1988-11-05",
    gioi_tinh: "Nam",
    email: "huy@gmail.com",
    so_dien_thoai: "0934567890",
    chuyen_mon: "Tiếng Nhật",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 4,
    ho_ten: "Phạm Thị Hương",
    ngay_sinh: "1992-02-15",
    gioi_tinh: "Nữ",
    email: "huong@gmail.com",
    so_dien_thoai: "0967891234",
    chuyen_mon: "Tiếng Hàn",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 5,
    ho_ten: "Đỗ Văn Nam",
    ngay_sinh: "1987-06-25",
    gioi_tinh: "Nam",
    email: "nam@gmail.com",
    so_dien_thoai: "0978123456",
    chuyen_mon: "Tiếng Anh",
    trang_thai: "Ngừng làm việc",
  },
  {
    ma_giao_vien: 6,
    ho_ten: "Vũ Thị Mai",
    ngay_sinh: "1993-09-18",
    gioi_tinh: "Nữ",
    email: "mai@gmail.com",
    so_dien_thoai: "0901234567",
    chuyen_mon: "Tiếng Trung",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 7,
    ho_ten: "Hoàng Đức Anh",
    ngay_sinh: "1989-03-10",
    gioi_tinh: "Nam",
    email: "ducanh@gmail.com",
    so_dien_thoai: "0923456789",
    chuyen_mon: "Tiếng Nhật",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 8,
    ho_ten: "Bùi Thị Ngọc",
    ngay_sinh: "1991-12-22",
    gioi_tinh: "Nữ",
    email: "ngoc@gmail.com",
    so_dien_thoai: "0945678901",
    chuyen_mon: "Tiếng Hàn",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 9,
    ho_ten: "Ngô Minh Tuấn",
    ngay_sinh: "1986-07-08",
    gioi_tinh: "Nam",
    email: "tuan@gmail.com",
    so_dien_thoai: "0956789012",
    chuyen_mon: "Tiếng Anh",
    trang_thai: "Đang làm việc",
  },
  {
    ma_giao_vien: 10,
    ho_ten: "Đặng Thị Thu",
    ngay_sinh: "1994-01-30",
    gioi_tinh: "Nữ",
    email: "thu@gmail.com",
    so_dien_thoai: "0981234567",
    chuyen_mon: "Tiếng Trung",
    trang_thai: "Đang làm việc",
  },
];

export default function GiaoVien() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);

  const [form] = Form.useForm();

  // Thống kê
  const totalTeachers = teachers.length;

  const activeTeachers = teachers.filter(
    (teacher) => teacher.trang_thai === "Đang làm việc"
  ).length;

  const inactiveTeachers = totalTeachers - activeTeachers;

  // Tìm kiếm và lọc
  const filteredTeachers = teachers.filter((teacher) => {
    const keyword = searchText.trim().toLowerCase();

    const matchSearch =
      teacher.ho_ten.toLowerCase().includes(keyword) ||
      (teacher.email || "").toLowerCase().includes(keyword) ||
      (teacher.chuyen_mon || "").toLowerCase().includes(keyword) ||
      (teacher.so_dien_thoai || "").includes(keyword);

    const matchStatus =
      filterStatus === "all" ||
      teacher.trang_thai === filterStatus;

    return matchSearch && matchStatus;
  });

  // Mở form thêm
  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    form.setFieldsValue({
      trang_thai: "Đang làm việc",
    });
    setIsModalOpen(true);
  };

  // Mở form sửa
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue(teacher);
    setIsModalOpen(true);
  };

  // Lưu dữ liệu mẫu
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingTeacher) {
        setTeachers((prev) =>
          prev.map((teacher) =>
            teacher.ma_giao_vien === editingTeacher.ma_giao_vien
              ? { ...teacher, ...values }
              : teacher
          )
        );

        message.success("Cập nhật giáo viên thành công!");
      } else {
        const nextId =
          Math.max(0, ...teachers.map((t) => t.ma_giao_vien)) + 1;

        setTeachers((prev) => [
          ...prev,
          {
            ...values,
            ma_giao_vien: nextId,
          },
        ]);

        message.success("Thêm giáo viên thành công!");
      }

      setIsModalOpen(false);
      setEditingTeacher(null);
      form.resetFields();
    } catch {
      // Form không hợp lệ, Ant Design hiển thị lỗi.
    }
  };

  // Xóa khỏi danh sách mẫu
  const handleDelete = (id) => {
    setTeachers((prev) =>
      prev.filter((teacher) => teacher.ma_giao_vien !== id)
    );

    message.success("Đã xóa giáo viên khỏi danh sách mẫu!");
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
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Giới tính",
      dataIndex: "gioi_tinh",
      width: 95,
    },
    {
      title: "Chuyên môn",
      dataIndex: "chuyen_mon",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag
          color={
            status === "Đang làm việc" ? "green" : "red"
          }
        >
          {status}
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
            title="Xóa giáo viên?"
            description="Xóa giáo viên khỏi danh sách mẫu?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.ma_giao_vien)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
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
              value={totalTeachers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Đang làm việc"
              value={activeTeachers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Ngừng làm việc"
              value={inactiveTeachers}
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
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 170 }}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                {
                  value: "Đang làm việc",
                  label: "Đang làm việc",
                },
                {
                  value: "Ngừng làm việc",
                  label: "Ngừng làm việc",
                },
              ]}
            />
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm giáo viên
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredTeachers}
          rowKey="ma_giao_vien"
          pagination={{
            pageSize: 7,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} giáo viên`,
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
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="ho_ten"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ tên",
                  },
                ]}
              >
                <Input placeholder="Nhập họ tên" />
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
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Chuyên môn"
                name="chuyen_mon"
                rules={[
                  {
                    required: true,
                    message: "Chọn chuyên môn",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn chuyên môn"
                  options={[
                    { value: "Tiếng Anh", label: "Tiếng Anh" },
                    { value: "Tiếng Trung", label: "Tiếng Trung" },
                    { value: "Tiếng Nhật", label: "Tiếng Nhật" },
                    { value: "Tiếng Hàn", label: "Tiếng Hàn" },
                    { value: "Tiếng Pháp", label: "Tiếng Pháp" },
                  ]}
                />
              </Form.Item>
            </Col>

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
                      value: "Đang làm việc",
                      label: "Đang làm việc",
                    },
                    {
                      value: "Ngừng làm việc",
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
                label: "Ngày sinh",
                children: viewingTeacher.ngay_sinh || "—",
              },
              {
                key: "4",
                label: "Giới tính",
                children: viewingTeacher.gioi_tinh || "—",
              },
              {
                key: "5",
                label: "Email",
                children: viewingTeacher.email || "—",
              },
              {
                key: "6",
                label: "Số điện thoại",
                children: viewingTeacher.so_dien_thoai || "—",
              },
              {
                key: "7",
                label: "Chuyên môn",
                children: viewingTeacher.chuyen_mon,
              },
              {
                key: "8",
                label: "Trạng thái",
                children: (
                  <Tag
                    color={
                      viewingTeacher.trang_thai === "Đang làm việc"
                        ? "green"
                        : "red"
                    }
                  >
                    {viewingTeacher.trang_thai}
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
