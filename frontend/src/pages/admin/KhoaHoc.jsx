
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Button,
  Modal,
  Form,
  InputNumber,
  Descriptions,
  Popconfirm,
  message,
} from "antd";

import {
  BookOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import khoaHocService from "../../services/khoaHocService";

const statusOptions = [
  { value: true, label: "Đang mở" },
  { value: false, label: "Tạm ngừng" },
];

const languageOptions = [
  "Tiếng Anh",
  "Tiếng Trung",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Tiếng Pháp",
].map((language) => ({
  value: language,
  label: language,
}));

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền quản lý khóa học.";
  }

  return "Không thể kết nối đến máy chủ.";
}

export default function KhoaHoc() {
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 1. Lấy danh sách khóa học từ MySQL
  const fetchCourses = useCallback(async () => {
    setLoading(true);

    try {
      const data = await khoaHocService.getAll({
        search: searchText.trim(),
        status:
          filterStatus === "all"
            ? undefined
            : filterStatus === "active",
        page,
        page_size: pageSize,
      });

      setCourses(data.items || []);
      setTotal(data.total || 0);
      setStats(
        data.stats || {
          total: 0,
          active: 0,
          inactive: 0,
        }
      );
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    searchText,
    filterStatus,
    page,
    pageSize,
    messageApi,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 2. Mở form thêm
  const handleAdd = () => {
    setEditingCourse(null);
    form.resetFields();
    form.setFieldsValue({ trang_thai: true });
    setModalOpen(true);
  };

  // 3. Mở form sửa
  const handleEdit = (course) => {
    setEditingCourse(course);
    form.resetFields();

    form.setFieldsValue({
      ten_khoa_hoc: course.ten_khoa_hoc,
      ngon_ngu: course.ngon_ngu,
      so_buoi: course.so_buoi,
      muc_tieu: course.muc_tieu,
      mo_ta: course.mo_ta,
      trang_thai: course.trang_thai,
    });

    setModalOpen(true);
  };

  // 4. Lưu khóa học vào MySQL
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
        ten_khoa_hoc: values.ten_khoa_hoc.trim(),
        ngon_ngu: values.ngon_ngu.trim(),
        so_buoi: values.so_buoi,
        muc_tieu: values.muc_tieu?.trim() || null,
        mo_ta: values.mo_ta?.trim() || null,
        trang_thai: values.trang_thai,
      };

      if (editingCourse) {
        await khoaHocService.update(
          editingCourse.ma_khoa_hoc,
          payload
        );

        messageApi.success("Cập nhật khóa học thành công!");
      } else {
        await khoaHocService.create(payload);
        messageApi.success("Thêm khóa học thành công!");
      }

      setModalOpen(false);
      setEditingCourse(null);
      form.resetFields();

      // Khóa học mới được xếp theo mã tăng dần,
      // vì vậy chuyển đến trang cuối để nhìn thấy.
      if (!editingCourse) {
        const newTotal = total + 1;
        const lastPage = Math.ceil(newTotal / pageSize);

        if (page !== lastPage) {
          setPage(lastPage);
        } else {
          await fetchCourses();
        }
      } else {
        await fetchCourses();
      }
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // 5. Tạm ngừng hoặc mở lại khóa học
  const handleChangeStatus = async (course) => {
    const newStatus = !course.trang_thai;

    try {
      await khoaHocService.changeStatus(
        course.ma_khoa_hoc,
        newStatus
      );

      messageApi.success(
        newStatus
          ? "Đã mở lại khóa học!"
          : "Đã tạm ngừng khóa học!"
      );

      await fetchCourses();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  // 6. Các cột bảng
  const columns = [
    {
      title: "Mã KH",
      dataIndex: "ma_khoa_hoc",
      width: 85,
    },
    {
      title: "Tên khóa học",
      dataIndex: "ten_khoa_hoc",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "ngon_ngu",
      render: (value) => (
        <Tag color="blue">{value}</Tag>
      ),
    },
    {
      title: "Số buổi",
      dataIndex: "so_buoi",
      width: 95,
      align: "center",
    },
    {
      title: "Mục tiêu",
      dataIndex: "muc_tieu",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Đang mở" : "Tạm ngừng"}
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
            title="Xem chi tiết"
            onClick={() => setViewingCourse(record)}
          />

          <Button
            icon={<EditOutlined />}
            title="Chỉnh sửa"
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title={
              record.trang_thai
                ? "Tạm ngừng khóa học?"
                : "Mở lại khóa học?"
            }
            description={
              record.trang_thai
                ? "Khóa học sẽ chuyển sang trạng thái tạm ngừng."
                : "Khóa học sẽ được mở lại."
            }
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => handleChangeStatus(record)}
          >
            <Button
              danger={record.trang_thai}
              icon={
                record.trang_thai
                  ? <PauseCircleOutlined />
                  : <PlayCircleOutlined />
              }
              title={
                record.trang_thai
                  ? "Tạm ngừng"
                  : "Mở lại"
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
          Quản lý khóa học
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý chương trình đào tạo và các khóa học
          của trung tâm
        </Typography.Text>
      </div>

      {/* Thẻ thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={stats.total}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Đang mở"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tạm ngừng"
              value={stats.inactive}
              prefix={<StopOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Danh sách khóa học */}
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
              placeholder="Tìm tên hoặc mã khóa học..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              allowClear
            />

            <Select
              style={{ width: 160 }}
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value);
                setPage(1);
              }}
              options={[
                {
                  value: "all",
                  label: "Tất cả trạng thái",
                },
                {
                  value: "active",
                  label: "Đang mở",
                },
                {
                  value: "inactive",
                  label: "Tạm ngừng",
                },
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCourses}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm khóa học
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={courses}
          rowKey="ma_khoa_hoc"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (count) =>
              `Tổng ${count} khóa học`,
            onChange: setPage,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* Form thêm / sửa khóa học */}
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
        confirmLoading={saving}
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={{ trang_thai: true }}
        >
          <Form.Item
            name="ten_khoa_hoc"
            label="Tên khóa học"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Nhập tên khóa học!",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: Tiếng Anh giao tiếp"
              maxLength={150}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ngon_ngu"
                label="Ngôn ngữ"
                rules={[
                  {
                    required: true,
                    message: "Chọn ngôn ngữ!",
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn ngôn ngữ"
                  options={languageOptions}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="so_buoi"
                label="Số buổi học"
                rules={[
                  {
                    required: true,
                    message: "Nhập số buổi!",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={500}
                  precision={0}
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
              {
                required: true,
                message: "Chọn trạng thái!",
              },
            ]}
          >
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Xem chi tiết khóa học */}
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
                children: viewingCourse.ma_khoa_hoc,
              },
              {
                key: "name",
                label: "Tên khóa học",
                children: viewingCourse.ten_khoa_hoc,
              },
              {
                key: "language",
                label: "Ngôn ngữ",
                children: viewingCourse.ngon_ngu,
              },
              {
                key: "lessons",
                label: "Số buổi",
                children: viewingCourse.so_buoi,
              },
              {
                key: "goal",
                label: "Mục tiêu",
                children: viewingCourse.muc_tieu || "—",
              },
              {
                key: "description",
                label: "Mô tả",
                children: viewingCourse.mo_ta || "—",
              },
              {
                key: "status",
                label: "Trạng thái",
                children: (
                  <Tag
                    color={
                      viewingCourse.trang_thai
                        ? "green"
                        : "red"
                    }
                  >
                    {viewingCourse.trang_thai
                      ? "Đang mở"
                      : "Tạm ngừng"}
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
