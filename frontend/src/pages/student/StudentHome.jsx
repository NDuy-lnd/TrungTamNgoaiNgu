
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  message,
} from "antd";

import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import studentDashboardService from "../../services/studentDashboardService";

const initialStats = {
  active_classes: 0,
  weekly_sessions: 0,
  present_sessions: 0,
  average_score: null,
};

function getStatusColor(status) {
  switch (status) {
    case "Đang học":
      return "green";
    case "Sắp mở":
      return "orange";
    case "Đã kết thúc":
      return "default";
    default:
      return "blue";
  }
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền xem thông tin này.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy hồ sơ học viên.";
  }

  return "Không thể tải dữ liệu Tổng quan từ máy chủ.";
}

export default function StudentHome() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Lấy dữ liệu từ MySQL thông qua FastAPI
  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const data = await studentDashboardService.getOverview();

      setProfile(data.profile || null);
      setStats(data.stats || initialStats);
      setClasses(data.classes || []);
      setSchedules(data.schedules || []);
      setGrades(data.grades || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));

      setProfile(null);
      setStats(initialStats);
      setClasses([]);
      setSchedules([]);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const scheduleColumns = [
    {
      title: "Thứ",
      dataIndex: "thu",
    },
    {
      title: "Lớp",
      dataIndex: "ten_lop",
      render: (name) => name || "—",
    },
    {
      title: "Giờ học",
      render: (_, record) =>
        `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    },
    {
      title: "Phòng",
      dataIndex: "phong_hoc",
      render: (value) => value || "—",
    },
  ];

  const gradeColumns = [
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (name) => name || "—",
    },
    {
      title: "Điểm tổng kết",
      dataIndex: "diem_tong_ket",
      render: (score) =>
        score === null || score === undefined
          ? "Chưa có"
          : Number(score).toFixed(2),
    },
    {
      title: "Trạng thái",
      dataIndex: "diem_tong_ket",
      render: (score) => {
        if (score === null || score === undefined) {
          return <Tag>Chưa có điểm</Tag>;
        }

        return Number(score) >= 5 ? (
          <Tag color="success">Đạt</Tag>
        ) : (
          <Tag color="error">Chưa đạt</Tag>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Typography.Title level={3}>
            Xin chào, {profile?.ho_ten || "Học viên"}! 👋
          </Typography.Title>

          <Typography.Paragraph type="secondary">
            Chào mừng trở lại cổng thông tin học viên.
          </Typography.Paragraph>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchDashboard}
        >
          Làm mới
        </Button>
      </div>

      {/* 4 thẻ thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Lớp đang học"
              value={stats.active_classes}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Buổi mỗi tuần"
              value={stats.weekly_sessions}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Số buổi có mặt"
              value={stats.present_sessions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Điểm TB đã có"
              value={
                stats.average_score === null
                  ? "—"
                  : Number(stats.average_score).toFixed(2)
              }
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Danh sách lớp */}
        <Col xs={24} xl={12}>
          <Card
            title="Lớp học của tôi"
            loading={loading}
            extra={
              <Button
                type="link"
                onClick={() => navigate("/student/lop-hoc")}
              >
                Xem tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            {classes.length === 0 ? (
              <Empty description="Chưa có lớp học" />
            ) : (
              classes.map((item) => (
                <Card
                  key={item.ma_xep_lop}
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>
                      {item.ten_lop}
                    </Typography.Text>

                    <Typography.Text type="secondary">
                      {item.ten_khoa_hoc}
                    </Typography.Text>

                    <Space wrap>
                      <Tag color={getStatusColor(item.trang_thai)}>
                        {item.trang_thai}
                      </Tag>

                      <Typography.Text type="secondary">
                        GV: {item.giao_vien}
                      </Typography.Text>
                    </Space>
                  </Space>
                </Card>
              ))
            )}
          </Card>
        </Col>

        {/* Lịch học */}
        <Col xs={24} xl={12}>
          <Card
            title="Lịch học hàng tuần"
            extra={
              <Button
                type="link"
                onClick={() => navigate("/student/lich-hoc")}
              >
                Xem lịch <ArrowRightOutlined />
              </Button>
            }
          >
            <Table
              rowKey="ma_lich"
              columns={scheduleColumns}
              dataSource={schedules}
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ x: 420 }}
              locale={{
                emptyText: "Chưa có lịch học",
              }}
            />
          </Card>
        </Col>

        {/* Kết quả học tập */}
        <Col xs={24}>
          <Card title="Kết quả học tập">
            <Table
              rowKey="ma_xep_lop"
              columns={gradeColumns}
              dataSource={grades}
              loading={loading}
              pagination={false}
              locale={{
                emptyText: "Chưa có kết quả học tập",
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
