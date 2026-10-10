
import { Row, Col, Card, Statistic, Typography, Table, Tag } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const stats = [
  { title: "Tổng học viên", value: 60, icon: <TeamOutlined /> },
  { title: "Giáo viên", value: 10, icon: <UserOutlined /> },
  { title: "Khóa học", value: 8, icon: <BookOutlined /> },
  { title: "Lớp học", value: 14, icon: <BankOutlined /> },
];

const classes = [
  { key: 1, name: "A2-01", status: "Đang học" },
  { key: 2, name: "B1-02", status: "Đã kết thúc" },
  { key: 3, name: "TOEIC-02", status: "Đã kết thúc" },
];

export default function Dashboard() {
  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Tổng quan
      </Title>
      <Text type="secondary">
        Theo dõi tình hình hoạt động của trung tâm
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {stats.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.title}>
            <Card className="stat-card">
              <div className="stat-icon">{item.icon}</div>
              <Statistic title={item.title} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Danh sách lớp học nổi bật"
        style={{ marginTop: 24 }}>
        <Table
          dataSource={classes}
          pagination={false}
          columns={[
            { title: "Tên lớp", dataIndex: "name" },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (status) => (
                <Tag color={
                  status === "Đang học" ? "blue" : "green"
                }>
                  {status}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
