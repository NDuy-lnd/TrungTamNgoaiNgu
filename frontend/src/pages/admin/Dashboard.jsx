
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Row,
  Col,
  Card,
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
  BookOutlined,
  BankOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import adminDashboardService from "../../services/adminDashboardService";

const { Title, Text } = Typography;

const initialStats = {
  total_students: 0,
  total_teachers: 0,
  total_courses: 0,
  total_classes: 0,
};

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền truy cập trang Tổng quan.";
  }

  return "Không thể tải dữ liệu Tổng quan từ máy chủ.";
}

function getStatusColor(status) {
  switch (status) {
    case "Đang học":
      return "blue";
    case "Sắp mở":
      return "orange";
    case "Đã kết thúc":
      return "green";
    default:
      return "default";
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(initialStats);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Lấy dữ liệu Tổng quan từ Backend
  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const data = await adminDashboardService.getOverview();

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

  // Tạo các thẻ thống kê từ dữ liệu MySQL
  const statCards = useMemo(
    () => [
      {
        title: "Tổng học viên",
        value: stats.total_students,
        icon: <TeamOutlined />,
      },
      {
        title: "Giáo viên",
        value: stats.total_teachers,
        icon: <UserOutlined />,
      },
      {
        title: "Khóa học",
        value: stats.total_courses,
        icon: <BookOutlined />,
      },
      {
        title: "Lớp học",
        value: stats.total_classes,
        icon: <BankOutlined />,
      },
    ],
    [stats]
  );

  const columns = [
    {
      title: "Tên lớp",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ marginTop: 0 }}>
            Tổng quan
          </Title>

          <Text type="secondary">
            Theo dõi tình hình hoạt động của trung tâm
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDashboard}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* 4 thẻ thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginTop: 24 }}
      >
        {statCards.map((item) => (
          <Col
            xs={24}
            sm={12}
            xl={6}
            key={item.title}
          >
            <Card
              className="stat-card"
              loading={loading}
            >
              <div className="stat-icon">
                {item.icon}
              </div>

              <Statistic
                title={item.title}
                value={item.value}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Danh sách lớp học nổi bật */}
      <Card
        title="Danh sách lớp học nổi bật"
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={classes}
          columns={columns}
          rowKey="key"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: "Chưa có lớp học",
          }}
        />
      </Card>
    </div>
  );
}
