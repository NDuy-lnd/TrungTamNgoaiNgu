
import { useState } from "react";
import {
  Card, Typography, Table, Tag, Button,
  Modal, Descriptions, Input, Space, Statistic, Row, Col
} from "antd";
import {
  SearchOutlined, EyeOutlined,
  BookOutlined, TeamOutlined
} from "@ant-design/icons";
import {
  studentClasses,
  studentSchedules,
  formatDate
} from "../../data/studentDemoData";

export default function StudentClasses() {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = studentClasses.filter((item) =>
    `${item.ten_lop} ${item.ten_khoa_hoc}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
  );

  const columns = [
    { title: "Mã lớp", dataIndex: "ma_lop", width: 90 },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (name) => <strong>{name}</strong>
    },
    { title: "Khóa học", dataIndex: "ten_khoa_hoc" },
    { title: "Giáo viên", dataIndex: "giao_vien" },
    {
      title: "Thời gian",
      render: (_, record) =>
        `${formatDate(record.ngay_bat_dau)} - ${formatDate(record.ngay_ket_thuc)}`
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={status === "Đang học" ? "green" : "default"}>
          {status}
        </Tag>
      )
    },
    {
      title: "Chi tiết",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setSelected(record)}
        >
          Xem
        </Button>
      )
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>Lớp học của tôi</Typography.Title>
      <Typography.Paragraph type="secondary">
        Danh sách các lớp học viên đang tham gia
      </Typography.Paragraph>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="Tổng lớp"
              value={studentClasses.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="Lớp đang học"
              value={studentClasses.filter(
                (item) => item.trang_thai === "Đang học"
              ).length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm lớp hoặc khóa học..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ maxWidth: 320, marginBottom: 20 }}
        />
        <Table
          rowKey="ma_lop"
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={`Thông tin lớp ${selected?.ten_lop || ""}`}
        open={Boolean(selected)}
        onCancel={() => setSelected(null)}
        footer={null}
        width={720}
      >
        {selected && (
          <>
            <Descriptions
              bordered
              column={1}
              size="small"
              style={{ marginTop: 20 }}
            >
              <Descriptions.Item label="Tên lớp">
                {selected.ten_lop}
              </Descriptions.Item>
              <Descriptions.Item label="Khóa học">
                {selected.ten_khoa_hoc}
              </Descriptions.Item>
              <Descriptions.Item label="Giáo viên">
                {selected.giao_vien}
              </Descriptions.Item>
              <Descriptions.Item label="Sĩ số">
                {selected.si_so}/{selected.si_so_toi_da}
              </Descriptions.Item>
              <Descriptions.Item label="Bắt đầu">
                {formatDate(selected.ngay_bat_dau)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc">
                {formatDate(selected.ngay_ket_thuc)}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {selected.mo_ta}
              </Descriptions.Item>
            </Descriptions>

            <Typography.Title level={5} style={{ marginTop: 20 }}>
              Lịch học của lớp
            </Typography.Title>
            <Table
              size="small"
              pagination={false}
              rowKey="ma_lich"
              dataSource={studentSchedules.filter(
                (item) => item.ma_lop === selected.ma_lop
              )}
              columns={[
                { title: "Thứ", dataIndex: "thu" },
                {
                  title: "Thời gian",
                  render: (_, record) =>
                    `${record.gio_bat_dau} - ${record.gio_ket_thuc}`
                },
                { title: "Phòng", dataIndex: "phong_hoc" }
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
