
import { useNavigate } from "react-router-dom";
import {
  Card, Row, Col, Statistic, Typography,
  Table, Tag, Button, Space
} from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import {
  studentProfile,
  studentClasses,
  studentSchedules,
  studentAttendance,
  studentGrades,
  getStudentClass,
  getClassByEnrollment,
  formatDate
} from "../../data/studentDemoData";

export default function StudentHome() {
  const navigate = useNavigate();

  const present = studentAttendance.filter(
    (item) => item.trang_thai === "Có mặt"
  ).length;

  const scores = studentGrades
    .filter((item) => item.diem_tong_ket !== null)
    .map((item) => item.diem_tong_ket);

  const average = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : null;

  const scheduleColumns = [
    { title: "Thứ", dataIndex: "thu" },
    {
      title: "Lớp",
      dataIndex: "ma_lop",
      render: (id) => getStudentClass(id)?.ten_lop || "—"
    },
    {
      title: "Giờ học",
      render: (_, record) =>
        `${record.gio_bat_dau} - ${record.gio_ket_thuc}`
    },
    { title: "Phòng", dataIndex: "phong_hoc" }
  ];

  return (
    <div>
      <Typography.Title level={3}>
        Xin chào, {studentProfile.ho_ten}! 👋
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Chào mừng trở lại cổng thông tin học viên.
      </Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Lớp đang học"
              value={studentClasses.filter(
                (item) => item.trang_thai === "Đang học"
              ).length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Buổi mỗi tuần"
              value={studentSchedules.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Số buổi có mặt"
              value={present}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Điểm TB đã có"
              value={average === null ? "—" : Number(average.toFixed(2))}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card
            title="Lớp học của tôi"
            extra={
              <Button
                type="link"
                onClick={() => navigate("/student/lop-hoc")}
              >
                Xem tất cả <ArrowRightOutlined />
              </Button>
            }
          >
            {studentClasses.map((item) => (
              <Card
                key={item.ma_lop}
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
                  <Space>
                    <Tag color="green">{item.trang_thai}</Tag>
                    <Typography.Text type="secondary">
                      GV: {item.giao_vien}
                    </Typography.Text>
                  </Space>
                </Space>
              </Card>
            ))}
          </Card>
        </Col>

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
              dataSource={studentSchedules}
              pagination={false}
              size="small"
              scroll={{ x: 420 }}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Kết quả học tập">
            <Table
              rowKey="ma_diem"
              pagination={false}
              dataSource={studentGrades}
              columns={[
                {
                  title: "Lớp học",
                  render: (_, record) =>
                    getClassByEnrollment(record.ma_xep_lop)
                      ?.ten_lop || "—"
                },
                {
                  title: "Điểm tổng kết",
                  dataIndex: "diem_tong_ket",
                  render: (score) =>
                    score === null ? "Chưa có" : score.toFixed(2)
                },
                {
                  title: "Trạng thái",
                  render: (_, record) =>
                    record.diem_tong_ket === null ? (
                      <Tag>Chưa có điểm</Tag>
                    ) : record.diem_tong_ket >= 5 ? (
                      <Tag color="success">Đạt</Tag>
                    ) : (
                      <Tag color="error">Chưa đạt</Tag>
                    )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
