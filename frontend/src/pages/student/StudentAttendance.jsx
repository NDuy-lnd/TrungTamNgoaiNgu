
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Table,
  Tag,
  Progress,
  Space,
  Empty,
  Button,
  message,
} from "antd";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import studentAttendanceService from "../../services/studentAttendanceService";


function formatDate(value) {
  if (!value) return "—";

  const date = dayjs(value);

  return date.isValid()
    ? date.format("DD/MM/YYYY")
    : "—";
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
    return "Bạn không có quyền xem dữ liệu điểm danh.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy hồ sơ học viên.";
  }

  return "Không thể tải lịch sử điểm danh.";
}


export default function StudentAttendance() {
  const [messageApi, contextHolder] = message.useMessage();

  const [classId, setClassId] = useState("all");

  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);


  // 1. Lấy dữ liệu điểm danh từ MySQL
  const fetchAttendance = useCallback(async () => {
    setLoading(true);

    try {
      const data =
        await studentAttendanceService.getHistory();

      const newClasses = data.classes || [];
      const newRecords = data.records || [];

      setClasses(newClasses);
      setAttendance(newRecords);

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
      setAttendance([]);
      setClassId("all");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);


  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);


  // 2. Lọc theo lớp học
  const filtered = useMemo(() => {
    return attendance.filter(
      (record) =>
        classId === "all" ||
        record.ma_lop === classId
    );
  }, [attendance, classId]);


  // 3. Tính thống kê
  const present = useMemo(() => {
    return filtered.filter(
      (item) => item.trang_thai === "Có mặt"
    ).length;
  }, [filtered]);


  const absent = useMemo(() => {
    return filtered.filter(
      (item) => item.trang_thai === "Vắng mặt"
    ).length;
  }, [filtered]);


  const rate = filtered.length
    ? Number(
        (
          (present / filtered.length) *
          100
        ).toFixed(1)
      )
    : 0;


  // 4. Cột bảng lịch sử điểm danh
  const columns = [
    {
      title: "Ngày học",
      dataIndex: "ngay_hoc",
      render: (value) => formatDate(value),

      sorter: (a, b) =>
        a.ngay_hoc.localeCompare(b.ngay_hoc),

      defaultSortOrder: "descend",
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (value) => value || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",

      render: (status) => (
        <Tag
          color={
            status === "Có mặt"
              ? "green"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "ghi_chu",

      render: (value) => value || "—",
    },
  ];


  return (
    <div>
      {contextHolder}

      <Typography.Title level={3}>
        Lịch sử điểm danh
      </Typography.Title>

      <Typography.Paragraph type="secondary">
        Theo dõi tình trạng tham gia các buổi học
      </Typography.Paragraph>


      {/* 4 thẻ thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 20 }}
      >
        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Buổi đã ghi nhận"
              value={filtered.length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Có mặt"
              value={present}
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: "#52c41a",
              }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Vắng mặt"
              value={absent}
              prefix={<CloseCircleOutlined />}
              valueStyle={{
                color: "#ff4d4f",
              }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card loading={loading}>
            <Typography.Text type="secondary">
              Tỷ lệ chuyên cần
            </Typography.Text>

            <div style={{ marginTop: 10 }}>
              <Progress
                percent={rate}
                status="normal"
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
      </Row>


      {/* Bảng chi tiết */}
      <Card
        title="Chi tiết điểm danh"
        extra={
          <Space wrap>
            <Select
              value={classId}
              onChange={setClassId}
              style={{ width: 220 }}
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

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAttendance}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        {filtered.length || loading ? (
          <Table
            rowKey="ma_diem_danh"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 650 }}
          />
        ) : (
          <Empty description="Chưa có dữ liệu điểm danh" />
        )}

        <Typography.Text type="secondary">
          Tỷ lệ chuyên cần được tính trên các buổi
          đã có bản ghi điểm danh, không phải
          toàn bộ buổi dự kiến.
        </Typography.Text>
      </Card>
    </div>
  );
}
