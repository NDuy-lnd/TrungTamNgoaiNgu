
import { useState } from "react";
import {
  Card, Typography, Row, Col, Statistic,
  Table, Tag, Space, Input, Select,
  Button, Modal, Form, InputNumber,
  Descriptions, Popconfirm, message
} from "antd";

import {
  BookOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from "@ant-design/icons";

// Dữ liệu mẫu, chưa lấy từ MySQL
const initialCourses = [
  {
    ma_khoa_hoc: 1,
    ten_khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    ngon_ngu: "Tiếng Anh",
    mo_ta: "Rèn luyện kỹ năng nghe và nói cơ bản.",
    so_buoi: 30,
    muc_tieu: "Giao tiếp trong các tình huống thường ngày.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 2,
    ten_khoa_hoc: "Luyện thi IELTS 5.5",
    ngon_ngu: "Tiếng Anh",
    mo_ta: "Luyện bốn kỹ năng theo cấu trúc IELTS.",
    so_buoi: 48,
    muc_tieu: "Đạt mục tiêu IELTS 5.5.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 3,
    ten_khoa_hoc: "Luyện thi IELTS 6.5",
    ngon_ngu: "Tiếng Anh",
    mo_ta: "Luyện thi IELTS trình độ trung cấp.",
    so_buoi: 60,
    muc_tieu: "Đạt mục tiêu IELTS 6.5.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 4,
    ten_khoa_hoc: "Tiếng Trung HSK 1",
    ngon_ngu: "Tiếng Trung",
    mo_ta: "Tiếng Trung dành cho người mới bắt đầu.",
    so_buoi: 36,
    muc_tieu: "Nắm kiến thức và từ vựng HSK 1.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 5,
    ten_khoa_hoc: "Tiếng Trung HSK 2",
    ngon_ngu: "Tiếng Trung",
    mo_ta: "Tiếp tục phát triển nền tảng tiếng Trung.",
    so_buoi: 40,
    muc_tieu: "Đạt trình độ HSK 2.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 6,
    ten_khoa_hoc: "Tiếng Nhật N5",
    ngon_ngu: "Tiếng Nhật",
    mo_ta: "Học bảng chữ cái, từ vựng và ngữ pháp N5.",
    so_buoi: 45,
    muc_tieu: "Đạt trình độ JLPT N5.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 7,
    ten_khoa_hoc: "Tiếng Hàn TOPIK I",
    ngon_ngu: "Tiếng Hàn",
    mo_ta: "Khóa tiếng Hàn sơ cấp.",
    so_buoi: 42,
    muc_tieu: "Chuẩn bị cho kỳ thi TOPIK I.",
    trang_thai: "Đang mở"
  },
  {
    ma_khoa_hoc: 8,
    ten_khoa_hoc: "Tiếng Anh cho trẻ em",
    ngon_ngu: "Tiếng Anh",
    mo_ta: "Phát triển tiếng Anh qua hoạt động tương tác.",
    so_buoi: 32,
    muc_tieu: "Xây dựng nền tảng tiếng Anh cho trẻ.",
    trang_thai: "Tạm ngừng"
  }
];

const statusOptions = [
  { value: "Đang mở", label: "Đang mở" },
  { value: "Tạm ngừng", label: "Tạm ngừng" }
];

export default function KhoaHoc() {
  const [courses, setCourses] = useState(initialCourses);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [form] = Form.useForm();

  const activeCount = courses.filter(
    (c) => c.trang_thai === "Đang mở"
  ).length;

  const inactiveCount = courses.length - activeCount;

  const filteredCourses = courses.filter((course) => {
    const keyword = searchText.trim().toLowerCase();

    const matchesSearch =
      course.ten_khoa_hoc.toLowerCase().includes(keyword) ||
      course.ngon_ngu.toLowerCase().includes(keyword) ||
      String(course.ma_khoa_hoc).includes(keyword);

    const matchesStatus =
      filterStatus === "all" ||
      course.trang_thai === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingCourse(null);
    form.resetFields();
    form.setFieldsValue({ trang_thai: "Đang mở" });
    setModalOpen(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    form.setFieldsValue(course);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingCourse) {
        setCourses((prev) =>
          prev.map((course) =>
            course.ma_khoa_hoc === editingCourse.ma_khoa_hoc
              ? { ...course, ...values }
              : course
          )
        );
        message.success("Cập nhật khóa học thành công!");
      } else {
        const nextId =
          Math.max(0, ...courses.map((c) => c.ma_khoa_hoc)) + 1;

        setCourses((prev) => [
          ...prev,
          { ma_khoa_hoc: nextId, ...values }
        ]);
        message.success("Thêm khóa học thành công!");
      }

      setModalOpen(false);
      setEditingCourse(null);
      form.resetFields();
    } catch {
      // Ant Design hiển thị lỗi tại các trường không hợp lệ.
    }
  };

  const handleDelete = (id) => {
    setCourses((prev) =>
      prev.filter((course) => course.ma_khoa_hoc !== id)
    );
    message.success("Đã xóa khóa học khỏi dữ liệu mẫu!");
  };

  const columns = [
    {
      title: "Mã KH",
      dataIndex: "ma_khoa_hoc",
      width: 85
    },
    {
      title: "Tên khóa học",
      dataIndex: "ten_khoa_hoc",
      render: (value) => <strong>{value}</strong>
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "ngon_ngu",
      render: (value) => <Tag color="blue">{value}</Tag>
    },
    {
      title: "Số buổi",
      dataIndex: "so_buoi",
      width: 95,
      align: "center"
    },
    {
      title: "Mục tiêu",
      dataIndex: "muc_tieu",
      ellipsis: true
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={status === "Đang mở" ? "green" : "red"}>
          {status}
        </Tag>
      )
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
            title="Xem chi tiết"
            onClick={() => setViewingCourse(record)}
          />

          <Button
            icon={<EditOutlined />}
            title="Chỉnh sửa"
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Xóa khóa học?"
            description="Chỉ xóa khỏi dữ liệu mẫu hiện tại."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.ma_khoa_hoc)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ marginBottom: 4 }}
        >
          Quản lý khóa học
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý chương trình đào tạo và các khóa học
          của trung tâm
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={courses.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Đang mở"
              value={activeCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tạm ngừng"
              value={inactiveCount}
              prefix={<StopOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20
          }}
        >
          <Space wrap>
            <Input
              placeholder="Tìm tên hoặc mã khóa học..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Select
              style={{ width: 160 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                ...statusOptions
              ]}
            />
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm khóa học
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredCourses}
          rowKey="ma_khoa_hoc"
          pagination={{
            pageSize: 6,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} khóa học`
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* Biểu mẫu thêm / sửa khóa học */}
      <Modal
        title={
          editingCourse
            ? "Cập nhật khóa học"
            : "Thêm khóa học mới"
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingCourse(null);
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
          <Form.Item
            name="ten_khoa_hoc"
            label="Tên khóa học"
            rules={[
              { required: true, message: "Nhập tên khóa học!" }
            ]}
          >
            <Input placeholder="Ví dụ: Tiếng Anh giao tiếp" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ngon_ngu"
                label="Ngôn ngữ"
                rules={[
                  { required: true, message: "Chọn ngôn ngữ!" }
                ]}
              >
                <Select
                  placeholder="Chọn ngôn ngữ"
                  options={[
                    { value: "Tiếng Anh", label: "Tiếng Anh" },
                    { value: "Tiếng Trung", label: "Tiếng Trung" },
                    { value: "Tiếng Nhật", label: "Tiếng Nhật" },
                    { value: "Tiếng Hàn", label: "Tiếng Hàn" },
                    { value: "Tiếng Pháp", label: "Tiếng Pháp" }
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="so_buoi"
                label="Số buổi học"
                rules={[
                  { required: true, message: "Nhập số buổi!" }
                ]}
              >
                <InputNumber
                  min={1}
                  max={500}
                  style={{ width: "100%" }}
                  placeholder="Ví dụ: 30"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="muc_tieu"
            label="Mục tiêu khóa học"
          >
            <Input.TextArea
              rows={2}
              placeholder="Mục tiêu đầu ra của khóa học"
            />
          </Form.Item>

          <Form.Item
            name="mo_ta"
            label="Mô tả khóa học"
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả khóa học"
            />
          </Form.Item>

          <Form.Item
            name="trang_thai"
            label="Trạng thái"
            rules={[
              { required: true, message: "Chọn trạng thái!" }
            ]}
          >
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Cửa sổ xem chi tiết */}
      <Modal
        title="Chi tiết khóa học"
        open={!!viewingCourse}
        onCancel={() => setViewingCourse(null)}
        footer={
          <Button onClick={() => setViewingCourse(null)}>
            Đóng
          </Button>
        }
        width={650}
      >
        {viewingCourse && (
          <Descriptions
            bordered
            column={1}
            size="small"
            style={{ marginTop: 20 }}
            items={[
              {
                key: "id",
                label: "Mã khóa học",
                children: viewingCourse.ma_khoa_hoc
              },
              {
                key: "name",
                label: "Tên khóa học",
                children: viewingCourse.ten_khoa_hoc
              },
              {
                key: "language",
                label: "Ngôn ngữ",
                children: viewingCourse.ngon_ngu
              },
              {
                key: "lessons",
                label: "Số buổi",
                children: viewingCourse.so_buoi
              },
              {
                key: "goal",
                label: "Mục tiêu",
                children: viewingCourse.muc_tieu || "—"
              },
              {
                key: "description",
                label: "Mô tả",
                children: viewingCourse.mo_ta || "—"
              },
              {
                key: "status",
                label: "Trạng thái",
                children: (
                  <Tag
                    color={
                      viewingCourse.trang_thai === "Đang mở"
                        ? "green"
                        : "red"
                    }
                  >
                    {viewingCourse.trang_thai}
                  </Tag>
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
