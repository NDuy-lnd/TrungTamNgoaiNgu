
import { useState } from "react";
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
  message
} from "antd";

import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  ReloadOutlined
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
  Cell
} from "recharts";

// Dữ liệu mẫu, chưa kết nối MySQL
const overview = {
  students: 60,
  teachers: 10,
  courses: 8,
  classes: 14
};

const classStatusData = [
  { name: "Đang học", value: 8 },
  { name: "Sắp mở", value: 3 },
  { name: "Đã kết thúc", value: 3 }
];

const courseLanguageData = [
  { name: "Tiếng Anh", count: 4 },
  { name: "Tiếng Trung", count: 2 },
  { name: "Tiếng Nhật", count: 1 },
  { name: "Tiếng Hàn", count: 1 }
];

const COLORS = ["#1677ff", "#52c41a", "#faad14"];

const classData = [
  {
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    giao_vien: "Nguyễn Văn Minh",
    si_so: 12,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01",
    khoa_hoc: "Luyện thi IELTS 5.5",
    giao_vien: "Nguyễn Văn Minh",
    si_so: 15,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 3,
    ten_lop: "IELTS 6.5 - A01",
    khoa_hoc: "Luyện thi IELTS 6.5",
    giao_vien: "Ngô Minh Tuấn",
    si_so: 10,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 4,
    ten_lop: "HSK 1 - T01",
    khoa_hoc: "Tiếng Trung HSK 1",
    giao_vien: "Trần Thị Lan",
    si_so: 8,
    si_so_toi_da: 15,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 5,
    ten_lop: "HSK 2 - T01",
    khoa_hoc: "Tiếng Trung HSK 2",
    giao_vien: "Vũ Thị Mai",
    si_so: 9,
    si_so_toi_da: 15,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 6,
    ten_lop: "JLPT N5 - N01",
    khoa_hoc: "Tiếng Nhật N5",
    giao_vien: "Lê Quốc Huy",
    si_so: 11,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 7,
    ten_lop: "TOPIK I - H01",
    khoa_hoc: "Tiếng Hàn TOPIK I",
    giao_vien: "Phạm Thị Hương",
    si_so: 7,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 8,
    ten_lop: "Giao tiếp A02",
    khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    giao_vien: "Đỗ Văn Nam",
    si_so: 0,
    si_so_toi_da: 20,
    trang_thai: "Đang học"
  },
  {
    ma_lop: 9,
    ten_lop: "IELTS 5.5 - A02",
    khoa_hoc: "Luyện thi IELTS 5.5",
    giao_vien: "Ngô Minh Tuấn",
    si_so: 0,
    si_so_toi_da: 20,
    trang_thai: "Sắp mở"
  },
  {
    ma_lop: 10,
    ten_lop: "HSK 1 - T02",
    khoa_hoc: "Tiếng Trung HSK 1",
    giao_vien: "Trần Thị Lan",
    si_so: 0,
    si_so_toi_da: 15,
    trang_thai: "Sắp mở"
  },
  {
    ma_lop: 11,
    ten_lop: "TOPIK I - H02",
    khoa_hoc: "Tiếng Hàn TOPIK I",
    giao_vien: "Bùi Thị Ngọc",
    si_so: 0,
    si_so_toi_da: 20,
    trang_thai: "Sắp mở"
  },
  {
    ma_lop: 12,
    ten_lop: "Giao tiếp A00",
    khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    giao_vien: "Nguyễn Văn Minh",
    si_so: 0,
    si_so_toi_da: 20,
    trang_thai: "Đã kết thúc"
  },
  {
    ma_lop: 13,
    ten_lop: "JLPT N5 - N00",
    khoa_hoc: "Tiếng Nhật N5",
    giao_vien: "Hoàng Đức Anh",
    si_so: 0,
    si_so_toi_da: 20,
    trang_thai: "Đã kết thúc"
  },
  {
    ma_lop: 14,
    ten_lop: "HSK 1 - T00",
    khoa_hoc: "Tiếng Trung HSK 1",
    giao_vien: "Đặng Thị Thu",
    si_so: 0,
    si_so_toi_da: 15,
    trang_thai: "Đã kết thúc"
  }
];

const statusColors = {
  "Đang học": "green",
  "Sắp mở": "orange",
  "Đã kết thúc": "default"
};

export default function ThongKe() {
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredClasses = classData.filter(
    (item) =>
      filterStatus === "all" ||
      item.trang_thai === filterStatus
  );

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 90
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (value) => <strong>{value}</strong>
    },
    {
      title: "Khóa học",
      dataIndex: "khoa_hoc"
    },
    {
      title: "Giáo viên",
      dataIndex: "giao_vien"
    },
    {
      title: "Sĩ số",
      render: (_, record) =>
        `${record.si_so}/${record.si_so_toi_da}`
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <div>
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

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={overview.students}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Tổng giáo viên"
              value={overview.teachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={overview.courses}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Tổng lớp học"
              value={overview.classes}
              prefix={<ReadOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái lớp học">
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                  >
                    {classStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Số khóa học theo ngôn ngữ">
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseLanguageData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Số khóa học"
                    fill="#1677ff"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng tổng hợp */}
      <Card
        title="Tổng hợp tình hình lớp học"
        extra={
          <Space>
            <Select
              style={{ width: 170 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                {
                  value: "all",
                  label: "Tất cả trạng thái"
                },
                {
                  value: "Đang học",
                  label: "Đang học"
                },
                {
                  value: "Sắp mở",
                  label: "Sắp mở"
                },
                {
                  value: "Đã kết thúc",
                  label: "Đã kết thúc"
                }
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilterStatus("all");
                message.info(
                  "Đã đặt lại bộ lọc dữ liệu mẫu."
                );
              }}
            >
              Đặt lại
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="ma_lop"
          pagination={{
            pageSize: 7,
            showSizeChanger: false,
            showTotal: (total) =>
              `Tổng ${total} lớp học`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
