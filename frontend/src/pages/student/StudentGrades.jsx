
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
  Progress,
  Alert,
  Button,
  message,
} from "antd";

import {
  TrophyOutlined,
  CheckCircleOutlined,
  BookOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import studentGradeService from "../../services/studentGradeService";


const initialStats = {
  total_classes: 0,
  graded_classes: 0,
  average_score: null,
  passed_classes: 0,
  progress_percent: 0,
};


function classify(score) {
  if (score === null || score === undefined) {
    return "Chưa xếp loại";
  }

  if (score >= 8.5) return "Giỏi";
  if (score >= 7) return "Khá";
  if (score >= 5) return "Trung bình";

  return "Chưa đạt";
}


function getGradeResult(score) {
  if (score === null || score === undefined) {
    return {
      label: "Chưa có điểm",
      color: "default",
    };
  }

  if (score >= 5) {
    return {
      label: "Đạt",
      color: "success",
    };
  }

  return {
    label: "Chưa đạt",
    color: "error",
  };
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
    return "Bạn không có quyền xem bảng điểm.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy hồ sơ học viên.";
  }

  return "Không thể tải kết quả học tập.";
}


export default function StudentGrades() {
  const [messageApi, contextHolder] = message.useMessage();

  const [stats, setStats] = useState(initialStats);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);


  // Lấy dữ liệu từ MySQL thông qua FastAPI
  const fetchGrades = useCallback(async () => {
    setLoading(true);

    try {
      const data = await studentGradeService.getGrades();

      setStats(data.stats || initialStats);
      setGrades(data.grades || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));

      setStats(initialStats);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);


  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);


  const columns = [
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (value) => value || "—",
    },
    {
      title: "Khóa học",
      dataIndex: "ten_khoa_hoc",
      render: (value) => value || "—",
    },
    {
      title: "Điểm tổng kết",
      dataIndex: "diem_tong_ket",

      render: (score) =>
        score === null || score === undefined ? (
          <Typography.Text type="secondary">
            Chưa có điểm
          </Typography.Text>
        ) : (
          <Typography.Text strong>
            {Number(score).toFixed(2)}
          </Typography.Text>
        ),
    },
    {
      title: "Xếp loại tham khảo",
      dataIndex: "diem_tong_ket",
      render: (score) => classify(score),
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
          marginBottom: 20,
        }}
      >
        <div>
          <Typography.Title level={3}>
            Kết quả học tập
          </Typography.Title>

          <Typography.Paragraph type="secondary">
            Xem điểm tổng kết các lớp học đã tham gia
          </Typography.Paragraph>
        </div>

        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchGrades}
        >
          Làm mới
        </Button>
      </div>


      {/* 4 thẻ thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 20 }}
      >
        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng lớp"
              value={stats.total_classes}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Lớp đã có điểm"
              value={stats.graded_classes}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Điểm trung bình"
              value={
                stats.average_score === null
                  ? "—"
                  : Number(stats.average_score).toFixed(2)
              }
              prefix={<TrophyOutlined />}
              valueStyle={{
                color: "#1677ff",
              }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Lớp đạt"
              value={stats.passed_classes}
              valueStyle={{
                color: "#52c41a",
              }}
            />
          </Card>
        </Col>
      </Row>


      {/* Bảng điểm */}
      <Card
        title="Bảng điểm của tôi"
        style={{ marginBottom: 20 }}
      >
        <Table
          rowKey="ma_xep_lop"
          dataSource={grades}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
          locale={{
            emptyText: "Chưa có lớp học hoặc bảng điểm",
          }}
        />
      </Card>


      {/* Tiến độ kết quả */}
      <Card title="Tiến độ kết quả">
        <Typography.Paragraph>
          Đã có điểm tổng kết cho{" "}
          <strong>{stats.graded_classes}</strong>/
          <strong>{stats.total_classes}</strong> lớp.
        </Typography.Paragraph>

        <Progress
          percent={stats.progress_percent}
          status="normal"
        />

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message="Quy tắc đánh giá"
          description={
            "Thang điểm 10, ngưỡng đạt 5.0 và mức " +
            "xếp loại đang là quy ước mẫu. Kết quả " +
            "chính thức sẽ tuân theo quy định của trung tâm."
          }
        />
      </Card>
    </div>
  );
}
