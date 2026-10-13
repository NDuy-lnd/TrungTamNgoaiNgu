
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Segmented,
  Table,
  Tag,
  Empty,
  Space,
  Button,
  message,
} from "antd";

import {
  CalendarOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import teacherScheduleService from "../../services/teacherScheduleService";

const weekdays = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

const colors = [
  "blue",
  "purple",
  "green",
  "orange",
  "cyan",
  "magenta",
  "geekblue",
];

function getDurationHours(start, end) {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  return (
    (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60
  );
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền xem lịch giảng dạy.";
  }

  return "Không thể tải lịch giảng dạy từ máy chủ.";
}

export default function TeacherSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [classOptions, setClassOptions] = useState([]);

  const [selectedClass, setSelectedClass] = useState("all");
  const [viewMode, setViewMode] = useState("week");

  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // 1. Lấy lịch của giáo viên đang đăng nhập
  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    try {
      const data = await teacherScheduleService.getAll();

      setSchedules(data.items || []);
      setClassOptions(data.classes || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 2. Tạo màu riêng cho từng lớp
  const classColors = useMemo(() => {
    const result = {};

    classOptions.forEach((item, index) => {
      result[item.value] = colors[index % colors.length];
    });

    return result;
  }, [classOptions]);

  // 3. Lọc lịch theo lớp
  const filteredSchedules = useMemo(() => {
    return schedules.filter(
      (item) =>
        selectedClass === "all" ||
        item.ma_lop === selectedClass
    );
  }, [schedules, selectedClass]);

  // 4. Thống kê theo bộ lọc
  const totalHours = useMemo(() => {
    return filteredSchedules.reduce(
      (sum, item) =>
        sum +
        getDurationHours(
          item.gio_bat_dau,
          item.gio_ket_thuc
        ),
      0
    );
  }, [filteredSchedules]);

  const totalClasses = useMemo(() => {
    return new Set(
      filteredSchedules.map((item) => item.ma_lop)
    ).size;
  }, [filteredSchedules]);

  // 5. Cấu hình bảng danh sách
  const columns = [
    {
      title: "Thứ",
      dataIndex: "thu",
      sorter: (a, b) =>
        weekdays.indexOf(a.thu) -
        weekdays.indexOf(b.thu),
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (name, record) => (
        <Tag
          color={classColors[record.ma_lop] || "blue"}
        >
          {name}
        </Tag>
      ),
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "gio_bat_dau",
      sorter: (a, b) =>
        a.gio_bat_dau.localeCompare(b.gio_bat_dau),
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "gio_ket_thuc",
    },
    {
      title: "Phòng học",
      dataIndex: "phong_hoc",
      render: (room) => (
        <Space>
          <EnvironmentOutlined />
          {room}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Lịch giảng dạy
        </Typography.Title>

        <Typography.Text type="secondary">
          Theo dõi lịch giảng dạy cố định hàng tuần
        </Typography.Text>
      </div>

      {/* Thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Lớp phụ trách có lịch"
              value={totalClasses}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Buổi dạy mỗi tuần"
              value={filteredSchedules.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Giờ dạy mỗi tuần"
              value={Number(totalHours.toFixed(2))}
              precision={2}
              suffix="giờ"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Thời khóa biểu */}
      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Select
            value={selectedClass}
            onChange={setSelectedClass}
            style={{ width: 230 }}
            showSearch
            optionFilterProp="label"
            options={[
              {
                value: "all",
                label: "Tất cả lớp",
              },
              ...classOptions,
            ]}
          />

          <Space wrap>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                {
                  label: "Theo tuần",
                  value: "week",
                },
                {
                  label: "Danh sách",
                  value: "list",
                },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchSchedules}
            >
              Làm mới
            </Button>
          </Space>
        </Space>

        {viewMode === "list" ? (
          <Table
            columns={columns}
            dataSource={filteredSchedules}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 650 }}
            locale={{
              emptyText: "Chưa có lịch giảng dạy",
            }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {weekdays.map((day) => {
              const daySchedules = filteredSchedules
                .filter((item) => item.thu === day)
                .sort((a, b) =>
                  a.gio_bat_dau.localeCompare(
                    b.gio_bat_dau
                  )
                );

              return (
                <Col
                  key={day}
                  xs={24}
                  sm={12}
                  lg={8}
                  xl={6}
                >
                  <Card
                    size="small"
                    title={day}
                    loading={loading}
                    style={{ height: "100%" }}
                  >
                    {daySchedules.length === 0 ? (
                      <Empty
                        image={
                          Empty.PRESENTED_IMAGE_SIMPLE
                        }
                        description="Không có lịch dạy"
                      />
                    ) : (
                      daySchedules.map((item) => (
                        <Card
                          key={item.id}
                          size="small"
                          style={{
                            marginBottom: 8,
                            background: "#f5f7ff",
                            borderLeft:
                              "3px solid #1677ff",
                          }}
                        >
                          <Tag
                            color={
                              classColors[item.ma_lop] ||
                              "blue"
                            }
                          >
                            {item.ten_lop}
                          </Tag>

                          <div style={{ marginTop: 10 }}>
                            <ClockCircleOutlined />{" "}
                            {item.gio_bat_dau} -{" "}
                            {item.gio_ket_thuc}
                          </div>

                          <div style={{ marginTop: 6 }}>
                            <EnvironmentOutlined />{" "}
                            {item.phong_hoc}
                          </div>
                        </Card>
                      ))
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
}
