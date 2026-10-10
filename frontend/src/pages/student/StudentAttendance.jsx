
import { useState } from "react";
import {
  Card, Row, Col, Statistic, Typography,
  Select, Table, Tag, Progress, Space, Empty
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import {
  studentClasses,
  studentAttendance,
  getClassByEnrollment,
  formatDate
} from "../../data/studentDemoData";

export default function StudentAttendance() {
  const [classId, setClassId] = useState("all");

  const filtered = studentAttendance.filter((record) => {
    const studentClass = getClassByEnrollment(
      record.ma_xep_lop
    );

    return (
      classId === "all" ||
      studentClass?.ma_lop === classId
    );
  });

  const present = filtered.filter(
    (item) => item.trang_thai === "Có mặt"
  ).length;

  const absent = filtered.filter(
    (item) => item.trang_thai === "Vắng mặt"
  ).length;

  const rate = filtered.length
    ? Number(((present / filtered.length) * 100).toFixed(1))
    : 0;

  const columns = [
    {
      title: "Ngày học",
      dataIndex: "ngay_hoc",
      render: formatDate,
      sorter: (a, b) => a.ngay_hoc.localeCompare(b.ngay_hoc),
      defaultSortOrder: "descend"
    },
    {
      title: "Lớp học",
      render: (_, record) =>
        getClassByEnrollment(record.ma_xep_lop)?.ten_lop || "—"
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={status === "Có mặt" ? "green" : "red"}>
          {status}
        </Tag>
      )
    },
    {
      title: "Ghi chú",
      dataIndex: "ghi_chu",
      render: (value) => value || "—"
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>
        Lịch sử điểm danh
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Theo dõi tình trạng tham gia các buổi học
      </Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Buổi đã ghi nhận"
              value={filtered.length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Có mặt"
              value={present}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Vắng mặt"
              value={absent}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
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

      <Card
        title="Chi tiết điểm danh"
        extra={
          <Select
            value={classId}
            onChange={setClassId}
            style={{ width: 220 }}
            options={[
              { value: "all", label: "Tất cả lớp" },
              ...studentClasses.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop
              }))
            ]}
          />
        }
      >
        {filtered.length ? (
          <Table
            rowKey="ma_diem_danh"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 650 }}
          />
        ) : (
          <Empty description="Chưa có dữ liệu điểm danh" />
        )}
        <Typography.Text type="secondary">
          Tỷ lệ chuyên cần được tính trên các buổi đã có
          bản ghi điểm danh, không phải toàn bộ buổi dự kiến.
        </Typography.Text>
      </Card>
    </div>
  );
}
