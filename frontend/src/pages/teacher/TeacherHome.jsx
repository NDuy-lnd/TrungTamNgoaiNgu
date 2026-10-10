
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag
} from "antd";

import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

import { useAuth } from "../../contexts/AuthContext";

const classes = [
  {
    id: 1,
    name: "Giao tiếp A01",
    course: "Tiếng Anh giao tiếp cơ bản",
    students: 12,
    schedule: "Thứ 2, Thứ 4 - 18:00",
    status: "Đang học"
  },
  {
    id: 2,
    name: "IELTS 5.5 - A01",
    course: "Luyện thi IELTS 5.5",
    students: 15,
    schedule: "Thứ 3, Thứ 5 - 18:00",
    status: "Đang học"
  }
];

const columns = [
  {
    title: "Tên lớp",
    dataIndex: "name",
    render: (name) => <strong>{name}</strong>
  },
  {
    title: "Khóa học",
    dataIndex: "course"
  },
  {
    title: "Sĩ số",
    dataIndex: "students"
  },
  {
    title: "Lịch học",
    dataIndex: "schedule"
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    render: (status) => (
      <Tag color="green">{status}</Tag>
    )
  }
];

export default function TeacherHome() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Tổng quan Giáo viên
        </Typography.Title>

        <Typography.Text type="secondary">
          Xin chào, {user?.name}! Chào mừng quay lại hệ thống.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lớp phụ trách"
              value={2}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677FF" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={27}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52C41A" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Buổi dạy mỗi tuần"
              value={4}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#722ED1" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lớp đang hoạt động"
              value={2}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#FA8C16" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách lớp đang phụ trách">
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
}
