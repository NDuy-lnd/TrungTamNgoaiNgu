
import { useCallback, useEffect, useState } from "react";
import {
  Card, Typography, Row, Col, Statistic,
  Table, Button, Input, Select, Space,
  Tag, Modal, Form, TimePicker,
  Popconfirm, message, Segmented, Empty
} from "antd";
import {
  CalendarOutlined, PlusOutlined,
  SearchOutlined, EditOutlined,
  DeleteOutlined, ClockCircleOutlined,
  HomeOutlined, ReloadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import lichHocService from "../../services/lichHocService";

dayjs.extend(customParseFormat);

const days = [
  "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5",
  "Thứ 6", "Thứ 7", "Chủ nhật"
];

const timeToMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

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
    return "Bạn không có quyền quản lý lịch học.";
  }

  return "Không thể kết nối đến máy chủ.";
}

export default function LichHoc() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [filterDay, setFilterDay] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [viewMode, setViewMode] = useState("Thời khóa biểu");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    classes: 0,
    rooms: 0,
  });

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Lấy lịch học thực tế từ MySQL
  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    try {
      const data = await lichHocService.getAll();
      setSchedules(data.items || []);
      setStats(data.stats || {
        total: 0,
        classes: 0,
        rooms: 0,
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  // Lấy danh sách lớp học để chọn
  const fetchClasses = useCallback(async () => {
    try {
      const data = await lichHocService.getOptions();
      setClasses(data || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  }, [messageApi]);

  useEffect(() => {
    fetchSchedules();
    fetchClasses();
  }, [fetchSchedules, fetchClasses]);

  const className = (id) =>
    classes.find((item) => item.ma_lop === id)?.ten_lop ||
    "Chưa xác định";

  // Tìm kiếm và lọc
  const filteredSchedules = schedules.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    const matchesSearch =
      item.ten_lop.toLowerCase().includes(keyword) ||
      item.phong_hoc.toLowerCase().includes(keyword);

    const matchesDay =
      filterDay === "all" || item.thu === filterDay;

    const matchesClass =
      filterClass === "all" || item.ma_lop === filterClass;

    return matchesSearch && matchesDay && matchesClass;
  });

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingSchedule(item);
    form.resetFields();

    form.setFieldsValue({
      ma_lop: item.ma_lop,
      thu: item.thu,
      gio_bat_dau: dayjs(item.gio_bat_dau, "HH:mm"),
      gio_ket_thuc: dayjs(item.gio_ket_thuc, "HH:mm"),
      phong_hoc: item.phong_hoc,
    });

    setModalOpen(true);
  };

  // Lưu thêm hoặc sửa lịch học
  const handleSave = async () => {
    let values;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const data = {
      ma_lop: values.ma_lop,
      thu: values.thu,
      gio_bat_dau: values.gio_bat_dau.format("HH:mm"),
      gio_ket_thuc: values.gio_ket_thuc.format("HH:mm"),
      phong_hoc: values.phong_hoc.trim().toUpperCase(),
    };

    if (
      timeToMinutes(data.gio_ket_thuc) <=
      timeToMinutes(data.gio_bat_dau)
    ) {
      messageApi.error("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }

    setSaving(true);

    try {
      if (editingSchedule) {
        await lichHocService.update(
          editingSchedule.ma_lich,
          data
        );
        messageApi.success("Cập nhật lịch học thành công!");
      } else {
        await lichHocService.create(data);
        messageApi.success("Thêm lịch học thành công!");
      }

      setModalOpen(false);
      setEditingSchedule(null);
      form.resetFields();

      await fetchSchedules();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Xóa lịch học trong MySQL
  const handleDelete = async (id) => {
    try {
      await lichHocService.delete(id);
      messageApi.success("Đã xóa lịch học!");
      await fetchSchedules();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };

  const columns = [
    {
      title: "Mã lịch",
      dataIndex: "ma_lich",
      width: 90,
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Thứ",
      dataIndex: "thu",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "gio_bat_dau",
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "gio_ket_thuc",
    },
    {
      title: "Phòng học",
      dataIndex: "phong_hoc",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Chỉnh sửa"
          />

          <Popconfirm
            title="Xóa lịch học?"
            description="Lịch học này sẽ bị xóa khỏi MySQL."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.ma_lich)}
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

  const availableClasses = classes.filter(
    (item) =>
      item.trang_thai !== "Đã kết thúc" ||
      item.ma_lop === editingSchedule?.ma_lop
  );

  return (
    <div>
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ marginBottom: 4 }}
        >
          Quản lý lịch học
        </Typography.Title>

        <Typography.Text type="secondary">
          Thiết lập thời khóa biểu lặp lại hàng tuần
          cho các lớp học
        </Typography.Text>
      </div>

      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng lịch học"
              value={stats.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Số lớp có lịch"
              value={stats.classes}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Phòng học sử dụng"
              value={stats.rooms}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Danh sách / thời khóa biểu */}
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
              placeholder="Tìm lớp hoặc phòng học..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Select
              value={filterDay}
              onChange={setFilterDay}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "Tất cả thứ" },
                ...days.map((day) => ({
                  value: day,
                  label: day,
                })),
              ]}
            />

            <Select
              value={filterClass}
              onChange={setFilterClass}
              style={{ width: 200 }}
              showSearch
              optionFilterProp="label"
              options={[
                { value: "all", label: "Tất cả lớp" },
                ...classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop,
                })),
              ]}
            />
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => {
                fetchSchedules();
                fetchClasses();
              }}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm lịch học
            </Button>
          </Space>
        </Space>

        <Segmented
          style={{ marginBottom: 20 }}
          options={["Thời khóa biểu", "Danh sách"]}
          value={viewMode}
          onChange={setViewMode}
        />

        {viewMode === "Danh sách" ? (
          <Table
            columns={columns}
            dataSource={filteredSchedules}
            rowKey="ma_lich"
            loading={loading}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (count) =>
                `Tổng ${count} lịch học`,
            }}
            scroll={{ x: 900 }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {days.map((day) => {
              const daySchedules = filteredSchedules
                .filter((item) => item.thu === day)
                .sort(
                  (a, b) =>
                    timeToMinutes(a.gio_bat_dau) -
                    timeToMinutes(b.gio_bat_dau)
                );

              return (
                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                  xl={6}
                  key={day}
                >
                  <Card
                    size="small"
                    title={day}
                    style={{
                      minHeight: 230,
                      height: "100%",
                    }}
                  >
                    {daySchedules.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có lịch"
                      />
                    ) : (
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                      >
                        {daySchedules.map((item) => (
                          <Card
                            key={item.ma_lich}
                            size="small"
                            style={{
                              background: "#f0f5ff",
                              borderColor: "#d6e4ff",
                            }}
                          >
                            <Typography.Text strong>
                              {item.ten_lop}
                            </Typography.Text>

                            <div style={{ marginTop: 6 }}>
                              <ClockCircleOutlined />{" "}
                              {item.gio_bat_dau} -{" "}
                              {item.gio_ket_thuc}
                            </div>

                            <div style={{ marginTop: 4 }}>
                              <HomeOutlined />{" "}
                              {item.phong_hoc}
                            </div>

                            <Space style={{ marginTop: 10 }}>
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(item)}
                              >
                                Sửa
                              </Button>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Thêm / sửa lịch học */}
      <Modal
        title={
          editingSchedule
            ? "Cập nhật lịch học"
            : "Thêm lịch học mới"
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingSchedule(null);
          form.resetFields();
        }}
        okText="Lưu lịch học"
        cancelText="Hủy"
        confirmLoading={saving}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="ma_lop"
            label="Lớp học"
            rules={[
              {
                required: true,
                message: "Chọn lớp học!",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn lớp học"
              options={availableClasses.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="thu"
            label="Thứ trong tuần"
            rules={[
              {
                required: true,
                message: "Chọn thứ!",
              },
            ]}
          >
            <Select
              placeholder="Chọn thứ"
              options={days.map((day) => ({
                value: day,
                label: day,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gio_bat_dau"
                label="Giờ bắt đầu"
                rules={[
                  {
                    required: true,
                    message: "Chọn giờ bắt đầu!",
                  },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={5}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="gio_ket_thuc"
                label="Giờ kết thúc"
                rules={[
                  {
                    required: true,
                    message: "Chọn giờ kết thúc!",
                  },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={5}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="phong_hoc"
            label="Phòng học"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Nhập phòng học!",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: P301"
              maxLength={50}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
