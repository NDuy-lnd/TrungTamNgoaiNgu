
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Select,
  Space,
  Button,
  message,
} from "antd";

import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import thongKeService from "../../services/thongKeService";

const COLORS = ["#1677ff", "#52c41a", "#faad14"];

const statusColors = {
  "Đang học": "green",
  "Sắp mở": "orange",
  "Đã kết thúc": "default",
};

const initialOverview = {
  students: 0,
  teachers: 0,
  courses: 0,
  classes: 0,
};

const initialClassStatus = [
  { name: "Đang học", value: 0 },
  { name: "Sắp mở", value: 0 },
  { name: "Đã kết thúc", value: 0 },
];

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền xem thống kê.";
  }

  return "Không thể tải dữ liệu thống kê từ máy chủ.";
}

export default function ThongKe() {
  const [overview, setOverview] = useState(initialOverview);
  const [classStatusData, setClassStatusData] =
    useState(initialClassStatus);
  const [courseLanguageData, setCourseLanguageData] =
    useState([]);
  const [classData, setClassData] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Lấy toàn bộ dữ liệu thống kê từ MySQL
  const fetchStatistics = useCallback(async () => {
    setLoading(true);

    try {
      const data = await thongKeService.getAll();

      setOverview(data.overview || initialOverview);

      setClassStatusData(
        data.classStatusData || initialClassStatus
      );

      setCourseLanguageData(
        data.courseLanguageData || []
      );

      setClassData(data.classData || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Lọc bảng tổng hợp theo trạng thái lớp
  const filteredClasses = classData.filter(
    (item) =>
      filterStatus === "all" ||
      item.trang_thai === filterStatus
  );

  // Tổng số lớp trong biểu đồ
  const totalChartClasses = classStatusData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 90,
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Khóa học",
      dataIndex: "khoa_hoc",
    },
    {
      title: "Giáo viên",
      dataIndex: "giao_vien",
    },
    {
      title: "Sĩ số",
      render: (_, record) =>
        `${record.si_so}/${record.si_so_toi_da}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ marginBottom: 4 }}
        >
          Thống kê và báo cáo
        </Typography.Title>

        <Typography.Text type="secondary">
          Tổng quan tình hình hoạt động của trung tâm
        </Typography.Text>
      </div>

      {/* 4 thẻ thống kê tổng quan */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng học viên"
              value={overview.students}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng giáo viên"
              value={overview.teachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng khóa học"
              value={overview.courses}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng lớp học"
              value={overview.classes}
              prefix={<ReadOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Hai biểu đồ */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        {/* Biểu đồ tròn trạng thái lớp học */}
        <Col xs={24} lg={12}>
          <Card
            title="Trạng thái lớp học"
            loading={loading}
          >
            <div style={{ width: "100%", height: 300 }}>
              {totalChartClasses === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography.Text type="secondary">
                    Chưa có dữ liệu lớp học
                  </Typography.Text>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={classStatusData.filter(
                        (item) => item.value > 0
                      )}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, value }) =>
                        `${name}: ${value}`
                      }
                    >
                      {classStatusData
                        .filter((item) => item.value > 0)
                        .map((entry) => {
                          const index =
                            classStatusData.findIndex(
                              (item) => item.name === entry.name
                            );

                          return (
                            <Cell
                              key={entry.name}
                              fill={
                                COLORS[index % COLORS.length]
                              }
                            />
                          );
                        })}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        {/* Biểu đồ cột khóa học theo ngôn ngữ */}
        <Col xs={24} lg={12}>
          <Card
            title="Số khóa học theo ngôn ngữ"
            loading={loading}
          >
            <div style={{ width: "100%", height: 300 }}>
              {courseLanguageData.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography.Text type="secondary">
                    Chưa có dữ liệu khóa học
                  </Typography.Text>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={courseLanguageData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="name"
                      interval={0}
                    />

                    <YAxis
                      allowDecimals={false}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      name="Số khóa học"
                      fill="#1677ff"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng tổng hợp lớp học */}
      <Card
        title="Tổng hợp tình hình lớp học"
        extra={
          <Space wrap>
            <Select
              style={{ width: 170 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                {
                  value: "all",
                  label: "Tất cả trạng thái",
                },
                {
                  value: "Đang học",
                  label: "Đang học",
                },
                {
                  value: "Sắp mở",
                  label: "Sắp mở",
                },
                {
                  value: "Đã kết thúc",
                  label: "Đã kết thúc",
                },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => {
                setFilterStatus("all");
                fetchStatistics();
              }}
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="ma_lop"
          loading={loading}
          pagination={{
            pageSize: 7,
            showSizeChanger: false,
            showTotal: (total) =>
              `Tổng ${total} lớp học`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
