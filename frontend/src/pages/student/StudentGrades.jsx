
import {
  Card, Row, Col, Statistic, Typography,
  Table, Tag, Progress, Alert
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  BookOutlined
} from "@ant-design/icons";
import {
  studentGrades,
  studentClasses,
  getClassByEnrollment,
  getGradeResult
} from "../../data/studentDemoData";

function classify(score) {
  if (score === null) return "Chưa xếp loại";
  if (score >= 8.5) return "Giỏi";
  if (score >= 7) return "Khá";
  if (score >= 5) return "Trung bình";
  return "Chưa đạt";
}

export default function StudentGrades() {
  const graded = studentGrades.filter(
    (item) => item.diem_tong_ket !== null
  );

  const passed = graded.filter(
    (item) => item.diem_tong_ket >= 5
  ).length;

  const average = graded.length
    ? graded.reduce(
        (sum, item) => sum + item.diem_tong_ket,
        0
      ) / graded.length
    : null;

  const columns = [
    {
      title: "Lớp học",
      render: (_, record) =>
        getClassByEnrollment(record.ma_xep_lop)?.ten_lop || "—"
    },
    {
      title: "Khóa học",
      render: (_, record) =>
        getClassByEnrollment(record.ma_xep_lop)
          ?.ten_khoa_hoc || "—"
    },
    {
      title: "Điểm tổng kết",
      dataIndex: "diem_tong_ket",
      render: (score) =>
        score === null ? (
          <Typography.Text type="secondary">
            Chưa có điểm
          </Typography.Text>
        ) : (
          <Typography.Text strong>
            {score.toFixed(2)}
          </Typography.Text>
        )
    },
    {
      title: "Xếp loại tham khảo",
      dataIndex: "diem_tong_ket",
      render: classify
    },
    {
      title: "Kết quả",
      dataIndex: "diem_tong_ket",
      render: (score) => {
        const result = getGradeResult(score);
        return (
          <Tag color={result.color}>
            {result.label}
          </Tag>
        );
      }
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>
        Kết quả học tập
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Xem điểm tổng kết các lớp học đã tham gia
      </Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng lớp"
              value={studentClasses.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Lớp đã có điểm"
              value={graded.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={
                average === null
                  ? "—"
                  : Number(average.toFixed(2))
              }
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Lớp đạt"
              value={passed}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Bảng điểm của tôi" style={{ marginBottom: 20 }}>
        <Table
          rowKey="ma_diem"
          dataSource={studentGrades}
          columns={columns}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      <Card title="Tiến độ kết quả">
        <Typography.Paragraph>
          Đã có điểm tổng kết cho {graded.length}/
          {studentClasses.length} lớp.
        </Typography.Paragraph>

        <Progress
          percent={
            studentClasses.length
              ? Math.round(
                  (graded.length / studentClasses.length) * 100
                )
              : 0
          }
        />

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message="Quy tắc đánh giá"
          description="Thang điểm 10, ngưỡng đạt 5.0 và mức xếp loại đang là quy ước mẫu. Kết quả chính thức sẽ tuân theo quy định của trung tâm."
        />
      </Card>
    </div>
  );
}
