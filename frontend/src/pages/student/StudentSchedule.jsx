
import { useState } from "react";
import {
  Card, Row, Col, Typography, Select,
  Segmented, Table, Tag, Empty, Space, Statistic
} from "antd";
import {
  CalendarOutlined, ClockCircleOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import {
  studentClasses,
  studentSchedules,
  weekDays,
  getStudentClass
} from "../../data/studentDemoData";

export default function StudentSchedule() {
  const [classId, setClassId] = useState("all");
  const [view, setView] = useState("week");

  const filtered = studentSchedules.filter(
    (item) => classId === "all" || item.ma_lop === classId
  );

  const columns = [
    {
      title: "Thứ",
      dataIndex: "thu",
      sorter: (a, b) =>
        weekDays.indexOf(a.thu) - weekDays.indexOf(b.thu)
    },
    {
      title: "Lớp học",
      render: (_, record) => (
        <Tag color="blue">
          {getStudentClass(record.ma_lop)?.ten_lop}
        </Tag>
      )
    },
    {
      title: "Giờ học",
      render: (_, record) =>
        `${record.gio_bat_dau} - ${record.gio_ket_thuc}`
    },
    { title: "Phòng học", dataIndex: "phong_hoc" }
  ];

  return (
    <div>
      <Typography.Title level={3}>Lịch học của tôi</Typography.Title>
      <Typography.Paragraph type="secondary">
        Thời khóa biểu cố định lặp lại hàng tuần
      </Typography.Paragraph>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="Buổi học mỗi tuần"
              value={filtered.length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="Số lớp"
              value={new Set(filtered.map((s) => s.ma_lop)).size}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24
          }}
        >
          <Select
            value={classId}
            onChange={setClassId}
            style={{ width: 240 }}
            options={[
              { value: "all", label: "Tất cả lớp" },
              ...studentClasses.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop
              }))
            ]}
          />
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { label: "Theo tuần", value: "week" },
              { label: "Danh sách", value: "list" }
            ]}
          />
        </Space>

        {view === "list" ? (
          <Table
            rowKey="ma_lich"
            columns={columns}
            dataSource={filtered}
            pagination={false}
            scroll={{ x: 600 }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {weekDays.map((day) => {
              const items = filtered
                .filter((item) => item.thu === day)
                .sort((a, b) =>
                  a.gio_bat_dau.localeCompare(b.gio_bat_dau)
                );

              return (
                <Col key={day} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    size="small"
                    title={day}
                    style={{ height: "100%" }}
                  >
                    {!items.length ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có lịch học"
                      />
                    ) : (
                      items.map((item) => (
                        <Card
                          key={item.ma_lich}
                          size="small"
                          style={{
                            marginBottom: 8,
                            background: "#f0f5ff",
                            borderLeft: "3px solid #1677ff"
                          }}
                        >
                          <Typography.Text strong>
                            {getStudentClass(item.ma_lop)?.ten_lop}
                          </Typography.Text>

                          <div style={{ marginTop: 10 }}>
                            <ClockCircleOutlined />{" "}
                            {item.gio_bat_dau} - {item.gio_ket_thuc}
                          </div>

                          <div style={{ marginTop: 6 }}>
                            <EnvironmentOutlined /> {item.phong_hoc}
                          </div>
                        </Card>
                      ))
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
}
