
import { useState } from "react";
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
  HomeOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";

const days = [
  "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5",
  "Thứ 6", "Thứ 7", "Chủ nhật"
];

// Lớp học mẫu
const classes = [
  { id: 1, name: "Giao tiếp A01" },
  { id: 2, name: "IELTS 5.5 - A01" },
  { id: 3, name: "IELTS 6.5 - A01" },
  { id: 4, name: "HSK 1 - T01" },
  { id: 5, name: "HSK 2 - T01" },
  { id: 6, name: "JLPT N5 - N01" },
  { id: 7, name: "TOPIK I - H01" },
  { id: 8, name: "Giao tiếp A02" },
  { id: 9, name: "IELTS 5.5 - A02" },
  { id: 10, name: "HSK 1 - T02" },
  { id: 11, name: "TOPIK I - H02" },
  { id: 12, name: "Giao tiếp A00" },
  { id: 13, name: "JLPT N5 - N00" },
  { id: 14, name: "HSK 1 - T00" }
];

// Lịch học mẫu lặp lại hàng tuần
const initialSchedules = [
  {
    ma_lich: 1, ma_lop: 1, thu: "Thứ 2",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P101"
  },
  {
    ma_lich: 2, ma_lop: 1, thu: "Thứ 4",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P101"
  },
  {
    ma_lich: 3, ma_lop: 2, thu: "Thứ 3",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P102"
  },
  {
    ma_lich: 4, ma_lop: 2, thu: "Thứ 5",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P102"
  },
  {
    ma_lich: 5, ma_lop: 3, thu: "Thứ 2",
    gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
    phong_hoc: "P103"
  },
  {
    ma_lich: 6, ma_lop: 4, thu: "Thứ 3",
    gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
    phong_hoc: "P101"
  },
  {
    ma_lich: 7, ma_lop: 5, thu: "Thứ 4",
    gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
    phong_hoc: "P102"
  },
  {
    ma_lich: 8, ma_lop: 6, thu: "Thứ 5",
    gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
    phong_hoc: "P103"
  },
  {
    ma_lich: 9, ma_lop: 7, thu: "Thứ 6",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P104"
  },
  {
    ma_lich: 10, ma_lop: 8, thu: "Thứ 7",
    gio_bat_dau: "09:00", gio_ket_thuc: "11:00",
    phong_hoc: "P105"
  },
  {
    ma_lich: 11, ma_lop: 9, thu: "Thứ 2",
    gio_bat_dau: "18:00", gio_ket_thuc: "20:00",
    phong_hoc: "P105"
  },
  {
    ma_lich: 12, ma_lop: 10, thu: "Thứ 4",
    gio_bat_dau: "14:00", gio_ket_thuc: "16:00",
    phong_hoc: "P103"
  }
];

const timeToMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const hasTimeOverlap = (aStart, aEnd, bStart, bEnd) =>
  timeToMinutes(aStart) < timeToMinutes(bEnd) &&
  timeToMinutes(bStart) < timeToMinutes(aEnd);

export default function LichHoc() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [searchText, setSearchText] = useState("");
  const [filterDay, setFilterDay] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [viewMode, setViewMode] = useState("Thời khóa biểu");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form] = Form.useForm();

  const className = (id) =>
    classes.find((item) => item.id === id)?.name ||
    "Chưa xác định";

  const filteredSchedules = schedules.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    const matchesSearch =
      className(item.ma_lop).toLowerCase().includes(keyword) ||
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

    form.setFieldsValue({
      ...item,
      gio_bat_dau: dayjs(item.gio_bat_dau, "HH:mm"),
      gio_ket_thuc: dayjs(item.gio_ket_thuc, "HH:mm")
    });

    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const data = {
        ...values,
        phong_hoc: values.phong_hoc.trim().toUpperCase(),
        gio_bat_dau: values.gio_bat_dau.format("HH:mm"),
        gio_ket_thuc: values.gio_ket_thuc.format("HH:mm")
      };

      if (
        timeToMinutes(data.gio_ket_thuc) <=
        timeToMinutes(data.gio_bat_dau)
      ) {
        message.error("Giờ kết thúc phải sau giờ bắt đầu!");
        return;
      }

      const conflict = schedules.find((item) => {
        if (
          editingSchedule &&
          item.ma_lich === editingSchedule.ma_lich
        ) {
          return false;
        }

        if (item.thu !== data.thu) return false;

        const overlap = hasTimeOverlap(
          item.gio_bat_dau,
          item.gio_ket_thuc,
          data.gio_bat_dau,
          data.gio_ket_thuc
        );

        if (!overlap) return false;

        return (
          item.phong_hoc.toUpperCase() === data.phong_hoc ||
          item.ma_lop === data.ma_lop
        );
      });

      if (conflict) {
        message.error(
          "Trùng lịch phòng học hoặc lớp học!"
        );
        return;
      }

      if (editingSchedule) {
        setSchedules((prev) =>
          prev.map((item) =>
            item.ma_lich === editingSchedule.ma_lich
              ? { ...item, ...data }
              : item
          )
        );
        message.success("Cập nhật lịch học thành công!");
      } else {
        const nextId =
          Math.max(0, ...schedules.map((s) => s.ma_lich)) + 1;

        setSchedules((prev) => [
          ...prev,
          { ma_lich: nextId, ...data }
        ]);
        message.success("Thêm lịch học thành công!");
      }

      setModalOpen(false);
      setEditingSchedule(null);
      form.resetFields();
    } catch {
      // Form chưa hợp lệ.
    }
  };

  const handleDelete = (id) => {
    setSchedules((prev) =>
      prev.filter((item) => item.ma_lich !== id)
    );
    message.success("Đã xóa lịch học khỏi dữ liệu mẫu!");
  };

  const columns = [
    {
      title: "Mã lịch",
      dataIndex: "ma_lich",
      width: 90
    },
    {
      title: "Lớp học",
      dataIndex: "ma_lop",
      render: (id) => <strong>{className(id)}</strong>
    },
    {
      title: "Thứ",
      dataIndex: "thu",
      render: (value) => <Tag color="blue">{value}</Tag>
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "gio_bat_dau"
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "gio_ket_thuc"
    },
    {
      title: "Phòng học",
      dataIndex: "phong_hoc"
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
      )
    }
  ];

  const uniqueRooms = new Set(
    schedules.map((s) => s.phong_hoc)
  ).size;

  return (
    <div>
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng lịch học"
              value={schedules.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Số lớp có lịch"
              value={
                new Set(schedules.map((s) => s.ma_lop)).size
              }
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Phòng học sử dụng"
              value={uniqueRooms}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#722ed1" }}
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
                  label: day
                }))
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
                ...classes.map((c) => ({
                  value: c.id,
                  label: c.name
                }))
              ]}
            />
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm lịch học
          </Button>
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
            pagination={{ pageSize: 8 }}
            scroll={{ x: 900 }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {days.map((day) => {
              const daySchedules = filteredSchedules
                .filter((s) => s.thu === day)
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
                      height: "100%"
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
                              borderColor: "#d6e4ff"
                            }}
                          >
                            <Typography.Text strong>
                              {className(item.ma_lop)}
                            </Typography.Text>

                            <div style={{ marginTop: 6 }}>
                              <ClockCircleOutlined />{" "}
                              {item.gio_bat_dau} -{" "}
                              {item.gio_ket_thuc}
                            </div>

                            <div style={{ marginTop: 4 }}>
                              <HomeOutlined /> {item.phong_hoc}
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

      {/* Form thêm / sửa lịch học */}
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
              { required: true, message: "Chọn lớp học!" }
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn lớp học"
              options={classes.map((c) => ({
                value: c.id,
                label: c.name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="thu"
            label="Thứ trong tuần"
            rules={[
              { required: true, message: "Chọn thứ!" }
            ]}
          >
            <Select
              placeholder="Chọn thứ"
              options={days.map((day) => ({
                value: day,
                label: day
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
                    message: "Chọn giờ bắt đầu!"
                  }
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
                    message: "Chọn giờ kết thúc!"
                  }
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
                message: "Nhập phòng học!"
              }
            ]}
          >
            <Input placeholder="Ví dụ: P101" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
