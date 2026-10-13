
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Segmented,
  Table,
  Tag,
  Empty,
  Space,
  Statistic,
  Button,
  message,
} from "antd";

import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import studentScheduleService from "../../services/studentScheduleService";

const weekDays = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền xem lịch học.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy hồ sơ học viên.";
  }

  return "Không thể tải lịch học từ máy chủ.";
}

export default function StudentSchedule() {
  const [messageApi, contextHolder] = message.useMessage();

  const [classId, setClassId] = useState("all");
  const [view, setView] = useState("week");

  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Lấy lịch học từ MySQL thông qua FastAPI
  const fetchSchedule = useCallback(async () => {
    setLoading(true);

    try {
      const data = await studentScheduleService.getSchedule();

      const newClasses = data.classes || [];
      const newSchedules = data.schedules || [];

      setClasses(newClasses);
      setSchedules(newSchedules);

      // Nếu lớp đang lọc không còn tồn tại,
      // tự động trở về "Tất cả lớp".
      setClassId((previous) => {
        if (previous === "all") {
          return previous;
        }

        const exists = newClasses.some(
          (item) => item.ma_lop === previous
        );

        return exists ? previous : "all";
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));

      setClasses([]);
      setSchedules([]);
      setClassId("all");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // 2. Lọc lịch học theo lớp
  const filtered = useMemo(() => {
    return schedules.filter(
      (item) =>
        classId === "all" ||
        item.ma_lop === classId
    );
  }, [schedules, classId]);

  // 3. Thống kê theo bộ lọc
  const totalSessions = filtered.length;

  const totalClasses = useMemo(() => {
    return new Set(
      filtered.map((item) => item.ma_lop)
    ).size;
  }, [filtered]);

  // 4. Các cột bảng lịch học
  const columns = [
    {
      title: "Thứ",
      dataIndex: "thu",
      sorter: (a, b) =>
        weekDays.indexOf(a.thu) -
        weekDays.indexOf(b.thu),
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (name) => (
        <Tag color="blue">
          {name}
        </Tag>
      ),
    },
    {
      title: "Giờ học",
      render: (_, record) =>
        `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    },
    {
      title: "Phòng học",
      dataIndex: "phong_hoc",
      render: (value) => value || "—",
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <Typography.Title level={3}>
        Lịch học của tôi
      </Typography.Title>

      <Typography.Paragraph type="secondary">
        Thời khóa biểu cố định lặp lại hàng tuần
      </Typography.Paragraph>

      {/* Thống kê */}
      <Row
        gutter={16}
        style={{ marginBottom: 20 }}
      >
        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Buổi học mỗi tuần"
              value={totalSessions}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Số lớp"
              value={totalClasses}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Nội dung lịch học */}
      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Space wrap>
            <Select
              value={classId}
              onChange={setClassId}
              style={{ width: 240 }}
              showSearch
              optionFilterProp="label"
              options={[
                {
                  value: "all",
                  label: "Tất cả lớp",
                },
                ...classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop,
                })),
              ]}
            />

            <Segmented
              value={view}
              onChange={setView}
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
          </Space>

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchSchedule}
          >
            Làm mới
          </Button>
        </Space>

        {/* Chế độ danh sách */}
        {view === "list" ? (
          <Table
            rowKey="ma_lich"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={false}
            scroll={{ x: 600 }}
            locale={{
              emptyText: "Chưa có lịch học",
            }}
          />
        ) : (
          /* Chế độ xem theo tuần */
          <Row gutter={[12, 12]}>
            {weekDays.map((day) => {
              const items = filtered
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
                    {!items.length ? (
                      <Empty
                        image={
                          Empty.PRESENTED_IMAGE_SIMPLE
                        }
                        description="Không có lịch học"
                      />
                    ) : (
                      items.map((item) => (
                        <Card
                          key={item.ma_lich}
                          size="small"
                          style={{
                            marginBottom: 8,
                            background: "#f0f5ff",
                            borderLeft:
                              "3px solid #1677ff",
                          }}
                        >
                          <Typography.Text strong>
                            {item.ten_lop}
                          </Typography.Text>

                          <div
                            style={{ marginTop: 10 }}
                          >
                            <ClockCircleOutlined />{" "}
                            {item.gio_bat_dau} -{" "}
                            {item.gio_ket_thuc}
                          </div>

                          <div
                            style={{ marginTop: 6 }}
                          >
                            <EnvironmentOutlined />{" "}
                            {item.phong_hoc || "Chưa có phòng"}
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
