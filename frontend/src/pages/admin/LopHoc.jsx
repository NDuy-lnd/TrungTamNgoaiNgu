
import { useCallback, useEffect, useState } from "react";
import {
  Card, Typography, Row, Col, Statistic, Table,
  Button, Input, Select, Space, Tag, Modal,
  Form, InputNumber, DatePicker, Descriptions,
  Popconfirm, message, List, Empty
} from "antd";
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  EyeOutlined, DeleteOutlined, TeamOutlined,
  BookOutlined, ClockCircleOutlined,
  UserAddOutlined, ReloadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import lopHocService from "../../services/lopHocService";

const statusOptions = [
  { value: "Sắp mở", label: "Sắp mở" },
  { value: "Đang học", label: "Đang học" },
  { value: "Đã kết thúc", label: "Đã kết thúc" },
];

const statusColor = {
  "Sắp mở": "orange",
  "Đang học": "green",
  "Đã kết thúc": "default",
};

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((x) => x.msg).join("; ");
  }
  return "Không thể kết nối đến máy chủ.";
}

export default function LopHoc() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);

  const [enrollingClass, setEnrollingClass] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classStudents, setClassStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 7;
  const [total, setTotal] = useState(0);

  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    finished: 0,
  });

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Danh sách lớp và thống kê
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lopHocService.getAll({
        search: searchText.trim(),
        status:
          filterStatus === "all" ? undefined : filterStatus,
        page,
        page_size: pageSize,
      });

      setClasses(data.items || []);
      setTotal(data.total || 0);
      setCounts(data.stats || {
        total: 0,
        active: 0,
        upcoming: 0,
        finished: 0,
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [searchText, filterStatus, page, messageApi]);

  // Khóa học, giáo viên và học viên từ MySQL
  const fetchOptions = useCallback(async () => {
    try {
      const data = await lopHocService.getOptions();
      setCourses(data.courses || []);
      setTeachers(data.teachers || []);
      setStudents(data.students || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  }, [messageApi]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const courseName = (id) =>
    courses.find((c) => c.ma_khoa_hoc === id)?.ten_khoa_hoc
    || "Chưa xác định";

  const teacherName = (id) =>
    teachers.find((t) => t.ma_giao_vien === id)?.ho_ten
    || "Chưa phân công";

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    form.setFieldsValue({
      trang_thai: "Sắp mở",
      si_so_toi_da: 20,
    });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingClass(item);
    form.resetFields();
    form.setFieldsValue({
      ...item,
      ngay_bat_dau: item.ngay_bat_dau
        ? dayjs(item.ngay_bat_dau) : null,
      ngay_ket_thuc: item.ngay_ket_thuc
        ? dayjs(item.ngay_ket_thuc) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (values.ngay_ket_thuc.isBefore(
      values.ngay_bat_dau, "day"
    )) {
      messageApi.error(
        "Ngày kết thúc phải từ ngày bắt đầu trở đi!"
      );
      return;
    }

    const payload = {
      ten_lop: values.ten_lop.trim(),
      ma_khoa_hoc: values.ma_khoa_hoc,
      ma_giao_vien: values.ma_giao_vien ?? null,
      si_so_toi_da: values.si_so_toi_da,
      ngay_bat_dau:
        values.ngay_bat_dau.format("YYYY-MM-DD"),
      ngay_ket_thuc:
        values.ngay_ket_thuc.format("YYYY-MM-DD"),
      trang_thai: values.trang_thai,
    };

    setSaving(true);
    try {
      if (editingClass) {
        await lopHocService.update(
          editingClass.ma_lop, payload
        );
        messageApi.success("Cập nhật lớp học thành công!");
      } else {
        await lopHocService.create(payload);
        messageApi.success("Thêm lớp học thành công!");
      }

      setModalOpen(false);
      setEditingClass(null);
      form.resetFields();

      if (!editingClass && filterStatus === "all"
          && !searchText.trim()) {
        const lastPage = Math.ceil((total + 1) / pageSize);
        if (page !== lastPage) {
          setPage(lastPage);
        } else {
          await fetchClasses();
        }
      } else {
        await fetchClasses();
      }
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await lopHocService.delete(item.ma_lop);
      messageApi.success("Đã xóa lớp học!");
      if (classes.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchClasses();
      }
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  // Mở cửa sổ xếp học viên
  const openEnrollment = async (item) => {
    setEnrollmentLoading(true);
    try {
      const data = await lopHocService.getStudents(
        item.ma_lop
      );
      setClassStudents(data);
      setSelectedStudents(
        data
          .filter((s) => s.trang_thai === "Đang học")
          .map((s) => s.ma_hoc_vien)
      );
      setEnrollingClass(item);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Lưu xếp lớp vào MySQL
  const saveEnrollment = async () => {
    if (!enrollingClass) return;

    if (
      selectedStudents.length >
      enrollingClass.si_so_toi_da
    ) {
      messageApi.error("Số học viên vượt quá sĩ số tối đa!");
      return;
    }

    setEnrollmentLoading(true);
    try {
      await lopHocService.saveStudents(
        enrollingClass.ma_lop,
        selectedStudents
      );

      messageApi.success(
        "Cập nhật danh sách lớp thành công!"
      );
      setEnrollingClass(null);
      await fetchClasses();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 85,
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Khóa học",
      dataIndex: "ten_khoa_hoc",
    },
    {
      title: "Giáo viên",
      dataIndex: "ten_giao_vien",
      render: (value) => value || "Chưa phân công",
    },
    {
      title: "Sĩ số",
      render: (_, record) =>
        `${record.si_so_hien_tai}/${record.si_so_toi_da}`,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "ngay_bat_dau",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={statusColor[status]}>{status}</Tag>
      ),
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
            disabled={record.trang_thai === "Đã kết thúc"}
            onClick={() => openEnrollment(record)}
          />

          <Button
            title="Chỉnh sửa"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Xóa lớp học?"
            description="Chỉ xóa được lớp chưa có dữ liệu liên quan."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record)}
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

  const stats = [
    {
      title: "Tổng lớp học",
      value: counts.total,
      icon: <BookOutlined />,
      color: "#1677ff",
    },
    {
      title: "Đang học",
      value: counts.active,
      icon: <TeamOutlined />,
      color: "#52c41a",
    },
    {
      title: "Sắp mở",
      value: counts.upcoming,
      icon: <ClockCircleOutlined />,
      color: "#faad14",
    },
    {
      title: "Đã kết thúc",
      value: counts.finished,
      icon: <BookOutlined />,
      color: "#8c8c8c",
    },
  ];

  const availableCourses = courses.filter(
    (c) => c.trang_thai || (
      editingClass &&
      c.ma_khoa_hoc === editingClass.ma_khoa_hoc
    )
  );

  const availableTeachers = teachers.filter(
    (t) => t.trang_thai || (
      editingClass &&
      t.ma_giao_vien === editingClass.ma_giao_vien
    )
  );

  const availableStudents = students.filter(
    (s) =>
      s.trang_thai ||
      selectedStudents.includes(s.ma_hoc_vien)
  );

  return (
    <div>
      {contextHolder}

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

      {/* Thống kê */}
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

      {/* Danh sách lớp */}
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
              placeholder="Tìm lớp, khóa học, giáo viên..."
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
                ...statusOptions,
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => {
                fetchClasses();
                fetchOptions();
              }}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm lớp học
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={classes}
          rowKey="ma_lop"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (count) =>
              `Tổng ${count} lớp học`,
            onChange: setPage,
          }}
          scroll={{ x: 1350 }}
        />
      </Card>

      {/* Thêm / sửa lớp */}
      <Modal
        title={
          editingClass
            ? "Cập nhật lớp học"
            : "Thêm lớp học"
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingClass(null);
          form.resetFields();
        }}
        okText="Lưu thông tin"
        cancelText="Hủy"
        confirmLoading={saving}
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
                  {
                    required: true,
                    whitespace: true,
                    message: "Nhập tên lớp!",
                  },
                ]}
              >
                <Input
                  placeholder="Ví dụ: IELTS Foundation A01"
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="ma_khoa_hoc"
                label="Khóa học"
                rules={[
                  {
                    required: true,
                    message: "Chọn khóa học!",
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn khóa học"
                  options={availableCourses.map((c) => ({
                    value: c.ma_khoa_hoc,
                    label: c.ten_khoa_hoc,
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
                  options={availableTeachers.map((t) => ({
                    value: t.ma_giao_vien,
                    label: t.ho_ten,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="si_so_toi_da"
                label="Sĩ số tối đa"
                rules={[
                  {
                    required: true,
                    message: "Nhập sĩ số!",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  precision={0}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="ngay_bat_dau"
                label="Ngày bắt đầu"
                rules={[
                  {
                    required: true,
                    message: "Chọn ngày bắt đầu!",
                  },
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
                  {
                    required: true,
                    message: "Chọn ngày kết thúc!",
                  },
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
                  {
                    required: true,
                    message: "Chọn trạng thái!",
                  },
                ]}
              >
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Chi tiết lớp */}
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
                children: viewingClass.ma_lop,
              },
              {
                key: "name",
                label: "Tên lớp",
                children: viewingClass.ten_lop,
              },
              {
                key: "course",
                label: "Khóa học",
                children: viewingClass.ten_khoa_hoc,
              },
              {
                key: "teacher",
                label: "Giáo viên",
                children:
                  viewingClass.ten_giao_vien ||
                  "Chưa phân công",
              },
              {
                key: "capacity",
                label: "Sĩ số",
                children:
                  `${viewingClass.si_so_hien_tai}/${viewingClass.si_so_toi_da}`,
              },
              {
                key: "start",
                label: "Ngày bắt đầu",
                children: viewingClass.ngay_bat_dau,
              },
              {
                key: "end",
                label: "Ngày kết thúc",
                children: viewingClass.ngay_ket_thuc,
              },
              {
                key: "status",
                label: "Trạng thái",
                children: (
                  <Tag color={statusColor[viewingClass.trang_thai]}>
                    {viewingClass.trang_thai}
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* Xếp học viên */}
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
        confirmLoading={enrollmentLoading}
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
              options={availableStudents.map((s) => ({
                value: s.ma_hoc_vien,
                label: `${s.ma_hoc_vien} - ${s.ho_ten}`,
                disabled: !s.trang_thai,
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
                  overflowY: "auto",
                }}
                dataSource={selectedStudents}
                renderItem={(id) => {
                  const student = students.find(
                    (s) => s.ma_hoc_vien === id
                  );
                  return (
                    <List.Item>
                      {student
                        ? `${id} - ${student.ho_ten}`
                        : `Học viên ${id}`}
                    </List.Item>
                  );
                }}
              />
            )}

            {classStudents.some(
              (s) => s.trang_thai !== "Đang học"
            ) && (
              <Typography.Text
                type="secondary"
                style={{ display: "block", marginTop: 12 }}
              >
                Các học viên đã hoàn thành hoặc rời lớp
                vẫn được lưu trong lịch sử xếp lớp.
              </Typography.Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
