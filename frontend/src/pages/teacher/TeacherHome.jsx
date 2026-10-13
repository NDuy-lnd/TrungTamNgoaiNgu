
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  message,
} from "antd";

import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { useAuth } from "../../contexts/AuthContext";

import teacherDashboardService from "../../services/teacherDashboardService";

const initialStats = {
  total_classes: 0,
  total_students: 0,
  weekly_sessions: 0,
  active_classes: 0,
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
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền truy cập.";
  }

  return "Không thể tải dữ liệu Tổng quan.";
}

const columns = [
  {
    title: "Tên lớp",
    dataIndex: "name",
    render: (name) => <strong>{name}</strong>,
  },
  {
    title: "Khóa học",
    dataIndex: "course",
  },
  {
    title: "Sĩ số",
    dataIndex: "students",
  },
  {
    title: "Lịch học",
    dataIndex: "schedule",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status) => (
      <Tag color={getStatusColor(status)}>
        {status}
      </Tag>
    ),
  },
];

export default function TeacherHome() {
  const { user } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const data =
        await teacherDashboardService.getOverview();

      setStats(data.stats || initialStats);
      setClasses(data.classes || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
      setStats(initialStats);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      {contextHolder}

      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div>
          <Typography.Title level={3}>
            Tổng quan Giáo viên
          </Typography.Title>

          <Typography.Text type="secondary">
            Xin chào, {user?.name || "Giáo viên"}!
            {" "}Chào mừng quay lại hệ thống.
          </Typography.Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchDashboard}
        >
          Làm mới
        </Button>
      </div>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Lớp phụ trách"
              value={stats.total_classes}
              prefix={<TeamOutlined />}
              valueStyle={{
                color: "#1677FF",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng học viên"
              value={stats.total_students}
              prefix={<UserOutlined />}
              valueStyle={{
                color: "#52C41A",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Buổi dạy mỗi tuần"
              value={stats.weekly_sessions}
              prefix={<CalendarOutlined />}
              valueStyle={{
                color: "#722ED1",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Lớp đang hoạt động"
              value={stats.active_classes}
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: "#FA8C16",
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách lớp đang phụ trách">
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
          scroll={{ x: 700 }}
          locale={{
            emptyText:
              "Bạn chưa được phân công lớp học nào",
          }}
        />
      </Card>
    </div>
  );
}
