
import { useMemo, useState } from "react";
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
  Space
} from "antd";

import {
  CalendarOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";

const schedules = [
  {
    id: 1,
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    thu: "Thứ 2",
    gio_bat_dau: "18:00",
    gio_ket_thuc: "20:00",
    phong_hoc: "P101"
  },
  {
    id: 2,
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01",
    thu: "Thứ 3",
    gio_bat_dau: "18:00",
    gio_ket_thuc: "20:00",
    phong_hoc: "P102"
  },
  {
    id: 3,
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    thu: "Thứ 4",
    gio_bat_dau: "18:00",
    gio_ket_thuc: "20:00",
    phong_hoc: "P101"
  },
  {
    id: 4,
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01",
    thu: "Thứ 5",
    gio_bat_dau: "18:00",
    gio_ket_thuc: "20:00",
    phong_hoc: "P102"
  }
];

const weekdays = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật"
];

const classColors = {
  1: "blue",
  2: "purple"
};

function getDurationHours(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  return (
    (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60
  );
}

export default function TeacherSchedule() {
  const [selectedClass, setSelectedClass] = useState("all");
  const [viewMode, setViewMode] = useState("week");

  const filteredSchedules = useMemo(() => {
    return schedules.filter(
      (item) =>
        selectedClass === "all" ||
        item.ma_lop === selectedClass
    );
  }, [selectedClass]);

  const totalHours = filteredSchedules.reduce(
    (sum, item) =>
      sum +
      getDurationHours(item.gio_bat_dau, item.gio_ket_thuc),
    0
  );

  const totalClasses = new Set(
    filteredSchedules.map((item) => item.ma_lop)
  ).size;

  const columns = [
    {
      title: "Thứ",
      dataIndex: "thu",
      sorter: (a, b) =>
        weekdays.indexOf(a.thu) - weekdays.indexOf(b.thu)
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (name, record) => (
        <Tag color={classColors[record.ma_lop] || "blue"}>
          {name}
        </Tag>
      )
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
      dataIndex: "phong_hoc",
      render: (room) => (
        <Space>
          <EnvironmentOutlined />
          {room}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Lịch giảng dạy
        </Typography.Title>

        <Typography.Text type="secondary">
          Theo dõi lịch giảng dạy cố định hàng tuần
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Lớp phụ trách"
              value={totalClasses}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Buổi dạy mỗi tuần"
              value={filteredSchedules.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Giờ dạy mỗi tuần"
              value={totalHours}
              prefix={<ClockCircleOutlined />}
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
            marginBottom: 24
          }}
        >
          <Select
            value={selectedClass}
            onChange={setSelectedClass}
            style={{ width: 230 }}
            options={[
              { value: "all", label: "Tất cả lớp" },
              { value: 1, label: "Giao tiếp A01" },
              { value: 2, label: "IELTS 5.5 - A01" }
            ]}
          />

          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: "Theo tuần", value: "week" },
              { label: "Danh sách", value: "list" }
            ]}
          />
        </Space>

        {viewMode === "list" ? (
          <Table
            columns={columns}
            dataSource={filteredSchedules}
            rowKey="id"
            pagination={false}
            scroll={{ x: 650 }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {weekdays.map((day) => {
              const daySchedules = filteredSchedules
                .filter((item) => item.thu === day)
                .sort((a, b) =>
                  a.gio_bat_dau.localeCompare(b.gio_bat_dau)
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
                    style={{ height: "100%" }}
                  >
                    {daySchedules.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
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
                            borderLeft: "3px solid #1677ff"
                          }}
                        >
                          <Tag
                            color={
                              classColors[item.ma_lop] || "blue"
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
