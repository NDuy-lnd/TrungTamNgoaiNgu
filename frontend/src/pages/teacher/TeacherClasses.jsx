
import { useState } from "react";

import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Modal,
  Descriptions,
  Tabs,
  Empty
} from "antd";

import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined
} from "@ant-design/icons";

// Dữ liệu mẫu cho giáo viên đang đăng nhập
const initialClasses = [
  {
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
    ngay_bat_dau: "2026-09-01",
    ngay_ket_thuc: "2026-12-01",
    si_so_toi_da: 20,
    trang_thai: "Đang học",
    lich_hoc: [
      {
        thu: "Thứ 2",
        gio: "18:00 - 20:00",
        phong: "P101"
      },
      {
        thu: "Thứ 4",
        gio: "18:00 - 20:00",
        phong: "P101"
      }
    ],
    hoc_vien: [
      {
        ma_hoc_vien: 1,
        ho_ten: "Nguyễn Văn An",
        email: "an@example.com",
        so_dien_thoai: "0912345678"
      },
      {
        ma_hoc_vien: 2,
        ho_ten: "Trần Thị Bình",
        email: "binh@example.com",
        so_dien_thoai: "0912345679"
      },
      {
        ma_hoc_vien: 3,
        ho_ten: "Lê Minh Đức",
        email: "duc@example.com",
        so_dien_thoai: "0912345680"
      },
      {
        ma_hoc_vien: 4,
        ho_ten: "Phạm Thị Hoa",
        email: "hoa@example.com",
        so_dien_thoai: "0912345681"
      }
    ]
  },
  {
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01",
    khoa_hoc: "Luyện thi IELTS 5.5",
    ngay_bat_dau: "2026-09-15",
    ngay_ket_thuc: "2027-01-15",
    si_so_toi_da: 20,
    trang_thai: "Đang học",
    lich_hoc: [
      {
        thu: "Thứ 3",
        gio: "18:00 - 20:00",
        phong: "P102"
      },
      {
        thu: "Thứ 5",
        gio: "18:00 - 20:00",
        phong: "P102"
      }
    ],
    hoc_vien: [
      {
        ma_hoc_vien: 5,
        ho_ten: "Hoàng Gia Huy",
        email: "huy@example.com",
        so_dien_thoai: "0912345682"
      },
      {
        ma_hoc_vien: 6,
        ho_ten: "Đỗ Thu Trang",
        email: "trang@example.com",
        so_dien_thoai: "0912345683"
      },
      {
        ma_hoc_vien: 7,
        ho_ten: "Bùi Minh Khang",
        email: "khang@example.com",
        so_dien_thoai: "0912345684"
      }
    ]
  }
];

const statusColors = {
  "Đang học": "green",
  "Sắp mở": "orange",
  "Đã kết thúc": "default"
};

export default function TeacherClasses() {
  const [classes] = useState(initialClasses);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedClass, setSelectedClass] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredClasses = classes.filter((item) => {
    const keyword = searchText.trim().toLowerCase();

    const matchesSearch =
      item.ten_lop.toLowerCase().includes(keyword) ||
      item.khoa_hoc.toLowerCase().includes(keyword);

    const matchesStatus =
      filterStatus === "all" ||
      item.trang_thai === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const openDetail = (record) => {
    setSelectedClass(record);
    setDetailOpen(true);
  };

  const studentColumns = [
    {
      title: "Mã học viên",
      dataIndex: "ma_hoc_vien",
      width: 120
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      render: (name) => <strong>{name}</strong>
    },
    {
      title: "Email",
      dataIndex: "email"
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai"
    }
  ];

  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 90
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (name) => <strong>{name}</strong>
    },
    {
      title: "Khóa học",
      dataIndex: "khoa_hoc"
    },
    {
      title: "Sĩ số mẫu",
      render: (_, record) =>
        `${record.hoc_vien.length}/${record.si_so_toi_da}`
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status}
        </Tag>
      )
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          Xem chi tiết
        </Button>
      )
    }
  ];

  const totalStudents = classes.reduce(
    (sum, item) => sum + item.hoc_vien.length,
    0
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Lớp của tôi
        </Typography.Title>

        <Typography.Text type="secondary">
          Theo dõi các lớp học được phân công giảng dạy
        </Typography.Text>
      </div>

      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Tổng lớp phụ trách"
              value={classes.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Học viên trong danh sách mẫu"
              value={totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Lớp đang học"
              value={
                classes.filter(
                  (item) => item.trang_thai === "Đang học"
                ).length
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Danh sách lớp */}
      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20
          }}
        >
          <Input
            placeholder="Tìm tên lớp hoặc khóa học..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 170 }}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "Đang học", label: "Đang học" },
              { value: "Sắp mở", label: "Sắp mở" },
              { value: "Đã kết thúc", label: "Đã kết thúc" }
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="ma_lop"
          pagination={{ pageSize: 6 }}
          scroll={{ x: 850 }}
        />
      </Card>

      {/* Chi tiết lớp */}
      <Modal
        title={
          selectedClass
            ? `Chi tiết lớp: ${selectedClass.ten_lop}`
            : "Chi tiết lớp"
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedClass(null);
        }}
        footer={null}
        width={850}
        destroyOnHidden
      >
        {selectedClass && (
          <Tabs
            items={[
              {
                key: "info",
                label: "Thông tin lớp",
                children: (
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                  >
                    <Descriptions.Item label="Mã lớp">
                      {selectedClass.ma_lop}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên lớp">
                      {selectedClass.ten_lop}
                    </Descriptions.Item>

                    <Descriptions.Item label="Khóa học">
                      {selectedClass.khoa_hoc}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày bắt đầu">
                      {selectedClass.ngay_bat_dau}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày kết thúc">
                      {selectedClass.ngay_ket_thuc}
                    </Descriptions.Item>

                    <Descriptions.Item label="Sĩ số">
                      {selectedClass.hoc_vien.length}/
                      {selectedClass.si_so_toi_da}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                      <Tag
                        color={
                          statusColors[selectedClass.trang_thai]
                        }
                      >
                        {selectedClass.trang_thai}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: "students",
                label: "Danh sách học viên",
                children: selectedClass.hoc_vien.length ? (
                  <Table
                    columns={studentColumns}
                    dataSource={selectedClass.hoc_vien}
                    rowKey="ma_hoc_vien"
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: 650 }}
                  />
                ) : (
                  <Empty description="Chưa có học viên" />
                )
              },
              {
                key: "schedule",
                label: "Lịch học",
                children: (
                  <Table
                    dataSource={selectedClass.lich_hoc}
                    rowKey={(_, index) => index}
                    pagination={false}
                    columns={[
                      {
                        title: "Thứ",
                        dataIndex: "thu"
                      },
                      {
                        title: "Giờ học",
                        dataIndex: "gio"
                      },
                      {
                        title: "Phòng học",
                        dataIndex: "phong"
                      }
                    ]}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
