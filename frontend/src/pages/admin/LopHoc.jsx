
import { useState } from "react";
import {
  Card, Typography, Row, Col, Statistic, Table,
  Button, Input, Select, Space, Tag, Modal,
  Form, InputNumber, DatePicker, Descriptions,
  Popconfirm, message, Tabs, List, Empty
} from "antd";
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  EyeOutlined, DeleteOutlined, TeamOutlined,
  BookOutlined, ClockCircleOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

// Dữ liệu mẫu khóa học
const courses = [
  { id: 1, name: "Tiếng Anh giao tiếp cơ bản" },
  { id: 2, name: "Luyện thi IELTS 5.5" },
  { id: 3, name: "Luyện thi IELTS 6.5" },
  { id: 4, name: "Tiếng Trung HSK 1" },
  { id: 5, name: "Tiếng Trung HSK 2" },
  { id: 6, name: "Tiếng Nhật N5" },
  { id: 7, name: "Tiếng Hàn TOPIK I" },
  { id: 8, name: "Tiếng Anh cho trẻ em" }
];

// Dữ liệu mẫu giáo viên
const teachers = [
  { id: 1, name: "Nguyễn Văn Minh" },
  { id: 2, name: "Trần Thị Lan" },
  { id: 3, name: "Lê Quốc Huy" },
  { id: 4, name: "Phạm Thị Hương" },
  { id: 5, name: "Đỗ Văn Nam" },
  { id: 6, name: "Vũ Thị Mai" },
  { id: 7, name: "Hoàng Đức Anh" },
  { id: 8, name: "Bùi Thị Ngọc" },
  { id: 9, name: "Ngô Minh Tuấn" },
  { id: 10, name: "Đặng Thị Thu" }
];

// Học viên mẫu để thử xếp lớp
const students = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: `Học viên mẫu ${i + 1}`
}));

const initialClasses = [
  {
    ma_lop: 1, ten_lop: "Giao tiếp A01",
    ma_khoa_hoc: 1, ma_giao_vien: 1,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-01",
    ngay_ket_thuc: "2026-12-01", trang_thai: "Đang học"
  },
  {
    ma_lop: 2, ten_lop: "IELTS 5.5 - A01",
    ma_khoa_hoc: 2, ma_giao_vien: 1,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-05",
    ngay_ket_thuc: "2027-01-05", trang_thai: "Đang học"
  },
  {
    ma_lop: 3, ten_lop: "IELTS 6.5 - A01",
    ma_khoa_hoc: 3, ma_giao_vien: 9,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-10",
    ngay_ket_thuc: "2027-02-10", trang_thai: "Đang học"
  },
  {
    ma_lop: 4, ten_lop: "HSK 1 - T01",
    ma_khoa_hoc: 4, ma_giao_vien: 2,
    si_so_toi_da: 15, ngay_bat_dau: "2026-09-15",
    ngay_ket_thuc: "2026-12-15", trang_thai: "Đang học"
  },
  {
    ma_lop: 5, ten_lop: "HSK 2 - T01",
    ma_khoa_hoc: 5, ma_giao_vien: 6,
    si_so_toi_da: 15, ngay_bat_dau: "2026-09-20",
    ngay_ket_thuc: "2027-01-20", trang_thai: "Đang học"
  },
  {
    ma_lop: 6, ten_lop: "JLPT N5 - N01",
    ma_khoa_hoc: 6, ma_giao_vien: 3,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-01",
    ngay_ket_thuc: "2027-01-01", trang_thai: "Đang học"
  },
  {
    ma_lop: 7, ten_lop: "TOPIK I - H01",
    ma_khoa_hoc: 7, ma_giao_vien: 4,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-12",
    ngay_ket_thuc: "2027-01-12", trang_thai: "Đang học"
  },
  {
    ma_lop: 8, ten_lop: "Giao tiếp A02",
    ma_khoa_hoc: 1, ma_giao_vien: 5,
    si_so_toi_da: 20, ngay_bat_dau: "2026-09-25",
    ngay_ket_thuc: "2026-12-25", trang_thai: "Đang học"
  },
  {
    ma_lop: 9, ten_lop: "IELTS 5.5 - A02",
    ma_khoa_hoc: 2, ma_giao_vien: 9,
    si_so_toi_da: 20, ngay_bat_dau: "2026-11-01",
    ngay_ket_thuc: "2027-03-01", trang_thai: "Sắp mở"
  },
  {
    ma_lop: 10, ten_lop: "HSK 1 - T02",
    ma_khoa_hoc: 4, ma_giao_vien: 2,
    si_so_toi_da: 15, ngay_bat_dau: "2026-11-05",
    ngay_ket_thuc: "2027-02-05", trang_thai: "Sắp mở"
  },
  {
    ma_lop: 11, ten_lop: "TOPIK I - H02",
    ma_khoa_hoc: 7, ma_giao_vien: 8,
    si_so_toi_da: 20, ngay_bat_dau: "2026-11-10",
    ngay_ket_thuc: "2027-03-10", trang_thai: "Sắp mở"
  },
  {
    ma_lop: 12, ten_lop: "Giao tiếp A00",
    ma_khoa_hoc: 1, ma_giao_vien: 1,
    si_so_toi_da: 20, ngay_bat_dau: "2026-01-05",
    ngay_ket_thuc: "2026-04-05", trang_thai: "Đã kết thúc"
  },
  {
    ma_lop: 13, ten_lop: "JLPT N5 - N00",
    ma_khoa_hoc: 6, ma_giao_vien: 7,
    si_so_toi_da: 20, ngay_bat_dau: "2026-02-01",
    ngay_ket_thuc: "2026-06-01", trang_thai: "Đã kết thúc"
  },
  {
    ma_lop: 14, ten_lop: "HSK 1 - T00",
    ma_khoa_hoc: 4, ma_giao_vien: 10,
    si_so_toi_da: 15, ngay_bat_dau: "2026-01-10",
    ngay_ket_thuc: "2026-04-10", trang_thai: "Đã kết thúc"
  }
];

const statusOptions = [
  { value: "Sắp mở", label: "Sắp mở" },
  { value: "Đang học", label: "Đang học" },
  { value: "Đã kết thúc", label: "Đã kết thúc" }
];

const statusColor = {
  "Sắp mở": "orange",
  "Đang học": "green",
  "Đã kết thúc": "default"
};

export default function LopHoc() {
  const [classes, setClasses] = useState(initialClasses);
  const [enrollments, setEnrollments] = useState({});
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [enrollingClass, setEnrollingClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [form] = Form.useForm();

  const courseName = (id) =>
    courses.find((c) => c.id === id)?.name || "Chưa xác định";

  const teacherName = (id) =>
    teachers.find((t) => t.id === id)?.name || "Chưa phân công";

  const getStudentIds = (classId) => enrollments[classId] || [];

  const filteredClasses = classes.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    const matchesSearch =
      item.ten_lop.toLowerCase().includes(keyword) ||
      courseName(item.ma_khoa_hoc).toLowerCase().includes(keyword) ||
      teacherName(item.ma_giao_vien).toLowerCase().includes(keyword);

    const matchesStatus =
      filterStatus === "all" || item.trang_thai === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    form.setFieldsValue({
      trang_thai: "Sắp mở",
      si_so_toi_da: 20
    });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingClass(item);
    form.setFieldsValue({
      ...item,
      ngay_bat_dau: item.ngay_bat_dau
        ? dayjs(item.ngay_bat_dau)
        : null,
      ngay_ket_thuc: item.ngay_ket_thuc
        ? dayjs(item.ngay_ket_thuc)
        : null
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const start = values.ngay_bat_dau;
      const end = values.ngay_ket_thuc;

      if (end.isBefore(start, "day")) {
        message.error("Ngày kết thúc phải sau ngày bắt đầu!");
        return;
      }

      const data = {
        ...values,
        ngay_bat_dau: start.format("YYYY-MM-DD"),
        ngay_ket_thuc: end.format("YYYY-MM-DD")
      };

      if (editingClass) {
        if (
          getStudentIds(editingClass.ma_lop).length >
          data.si_so_toi_da
        ) {
          message.error("Sĩ số tối đa nhỏ hơn số học viên đã xếp!");
          return;
        }

        setClasses((prev) =>
          prev.map((item) =>
            item.ma_lop === editingClass.ma_lop
              ? { ...item, ...data }
              : item
          )
        );
        message.success("Cập nhật lớp học thành công!");
      } else {
        const nextId =
          Math.max(0, ...classes.map((c) => c.ma_lop)) + 1;

        setClasses((prev) => [
          ...prev,
          { ma_lop: nextId, ...data }
        ]);
        message.success("Thêm lớp học thành công!");
      }

      setModalOpen(false);
      setEditingClass(null);
      form.resetFields();
    } catch {
      // Ant Design hiển thị lỗi xác thực biểu mẫu.
    }
  };

  const handleDelete = (classId) => {
    setClasses((prev) =>
      prev.filter((c) => c.ma_lop !== classId)
    );

    setEnrollments((prev) => {
      const updated = { ...prev };
      delete updated[classId];
      return updated;
    });

    message.success("Đã xóa lớp khỏi dữ liệu mẫu!");
  };

  const openEnrollment = (item) => {
    setEnrollingClass(item);
    setSelectedStudents(getStudentIds(item.ma_lop));
  };

  const saveEnrollment = () => {
    if (!enrollingClass) return;

    if (selectedStudents.length > enrollingClass.si_so_toi_da) {
      message.error("Số học viên vượt quá sĩ số tối đa!");
      return;
    }

    setEnrollments((prev) => ({
      ...prev,
      [enrollingClass.ma_lop]: selectedStudents
    }));

    setEnrollingClass(null);
    message.success("Cập nhật danh sách lớp thành công!");
  };

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 85
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (text) => <strong>{text}</strong>
    },
    {
      title: "Khóa học",
      dataIndex: "ma_khoa_hoc",
      render: (id) => courseName(id)
    },
    {
      title: "Giáo viên",
      dataIndex: "ma_giao_vien",
      render: (id) => teacherName(id)
    },
    {
      title: "Sĩ số",
      render: (_, record) =>
        `${getStudentIds(record.ma_lop).length}/${record.si_so_toi_da}`
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "ngay_bat_dau"
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={statusColor[status]}>{status}</Tag>
      )
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 190,
      render: (_, record) => (
        <Space size="small">
          <Button
            title="Xem chi tiết"
            icon={<EyeOutlined />}
            onClick={() => setViewingClass(record)}
          />
          <Button
            title="Xếp học viên"
            icon={<UserAddOutlined />}
            onClick={() => openEnrollment(record)}
          />
          <Button
            title="Chỉnh sửa"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa lớp học?"
            description="Xóa lớp khỏi dữ liệu mẫu?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.ma_lop)}
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

  const stats = [
    {
      title: "Tổng lớp học",
      value: classes.length,
      icon: <BookOutlined />,
      color: "#1677ff"
    },
    {
      title: "Đang học",
      value: classes.filter(
        (c) => c.trang_thai === "Đang học"
      ).length,
      icon: <TeamOutlined />,
      color: "#52c41a"
    },
    {
      title: "Sắp mở",
      value: classes.filter(
        (c) => c.trang_thai === "Sắp mở"
      ).length,
      icon: <ClockCircleOutlined />,
      color: "#faad14"
    },
    {
      title: "Đã kết thúc",
      value: classes.filter(
        (c) => c.trang_thai === "Đã kết thúc"
      ).length,
      icon: <BookOutlined />,
      color: "#8c8c8c"
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ marginBottom: 4 }}
        >
          Quản lý lớp học
        </Typography.Title>
        <Typography.Text type="secondary">
          Quản lý lớp, phân công giáo viên và xếp học viên
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.title}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
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
              placeholder="Tìm lớp, khóa học, giáo viên..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
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
                ...statusOptions
              ]}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm lớp học
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="ma_lop"
          pagination={{
            pageSize: 7,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} lớp học`
          }}
          scroll={{ x: 1350 }}
        />
      </Card>

      {/* Form thêm / sửa lớp */}
      <Modal
        title={editingClass ? "Cập nhật lớp học" : "Thêm lớp học"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingClass(null);
          form.resetFields();
        }}
        okText="Lưu thông tin"
        cancelText="Hủy"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="ten_lop"
                label="Tên lớp"
                rules={[
                  { required: true, message: "Nhập tên lớp!" }
                ]}
              >
                <Input placeholder="Ví dụ: IELTS 5.5 - A01" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ma_khoa_hoc"
                label="Khóa học"
                rules={[
                  { required: true, message: "Chọn khóa học!" }
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn khóa học"
                  options={courses.map((c) => ({
                    value: c.id,
                    label: c.name
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ma_giao_vien"
                label="Giáo viên phụ trách"
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="Chọn giáo viên"
                  options={teachers.map((t) => ({
                    value: t.id,
                    label: t.name
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="si_so_toi_da"
                label="Sĩ số tối đa"
                rules={[
                  { required: true, message: "Nhập sĩ số!" }
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ngay_bat_dau"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Chọn ngày bắt đầu!" }
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="ngay_ket_thuc"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: "Chọn ngày kết thúc!" }
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="trang_thai"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Chọn trạng thái!" }
                ]}
              >
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Chi tiết lớp học */}
      <Modal
        title="Chi tiết lớp học"
        open={!!viewingClass}
        onCancel={() => setViewingClass(null)}
        footer={
          <Button onClick={() => setViewingClass(null)}>
            Đóng
          </Button>
        }
        width={650}
      >
        {viewingClass && (
          <Descriptions
            bordered
            column={1}
            size="small"
            style={{ marginTop: 20 }}
            items={[
              {
                key: "id",
                label: "Mã lớp",
                children: viewingClass.ma_lop
              },
              {
                key: "name",
                label: "Tên lớp",
                children: viewingClass.ten_lop
              },
              {
                key: "course",
                label: "Khóa học",
                children: courseName(viewingClass.ma_khoa_hoc)
              },
              {
                key: "teacher",
                label: "Giáo viên",
                children: teacherName(viewingClass.ma_giao_vien)
              },
              {
                key: "capacity",
                label: "Sĩ số",
                children: `${getStudentIds(viewingClass.ma_lop).length}/${viewingClass.si_so_toi_da}`
              },
              {
                key: "start",
                label: "Ngày bắt đầu",
                children: viewingClass.ngay_bat_dau
              },
              {
                key: "end",
                label: "Ngày kết thúc",
                children: viewingClass.ngay_ket_thuc
              },
              {
                key: "status",
                label: "Trạng thái",
                children: (
                  <Tag color={statusColor[viewingClass.trang_thai]}>
                    {viewingClass.trang_thai}
                  </Tag>
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* Xếp học viên vào lớp */}
      <Modal
        title={
          enrollingClass
            ? `Xếp học viên - ${enrollingClass.ten_lop}`
            : "Xếp học viên"
        }
        open={!!enrollingClass}
        onOk={saveEnrollment}
        onCancel={() => setEnrollingClass(null)}
        okText="Lưu danh sách"
        cancelText="Hủy"
        width={650}
      >
        {enrollingClass && (
          <div style={{ marginTop: 20 }}>
            <Typography.Paragraph>
              Sĩ số đã chọn:{" "}
              <strong>
                {selectedStudents.length}/
                {enrollingClass.si_so_toi_da}
              </strong>
            </Typography.Paragraph>

            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              placeholder="Chọn học viên để xếp lớp"
              value={selectedStudents}
              onChange={setSelectedStudents}
              maxTagCount="responsive"
              options={students.map((s) => ({
                value: s.id,
                label: `${s.id} - ${s.name}`
              }))}
            />

            <Typography.Title
              level={5}
              style={{ marginTop: 24 }}
            >
              Danh sách học viên đã chọn
            </Typography.Title>

            {selectedStudents.length === 0 ? (
              <Empty description="Chưa chọn học viên" />
            ) : (
              <List
                size="small"
                bordered
                style={{
                  maxHeight: 240,
                  overflowY: "auto"
                }}
                dataSource={selectedStudents}
                renderItem={(id) => {
                  const student = students.find(
                    (s) => s.id === id
                  );
                  return (
                    <List.Item>
                      {student?.name || `Học viên ${id}`}
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
