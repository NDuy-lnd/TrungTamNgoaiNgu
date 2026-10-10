
import { useState } from "react";
import {
  Card, Typography, Table, Input,
  Select, Button, Space, Tag, message
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  LinkOutlined
} from "@ant-design/icons";
import {
  studentDocuments,
  studentClasses,
  getStudentClass,
  formatDate
} from "../../data/studentDemoData";

export default function StudentDocuments() {
  const [keyword, setKeyword] = useState("");
  const [classId, setClassId] = useState("all");
  const [messageApi, contextHolder] = message.useMessage();

  const filtered = studentDocuments.filter((item) => {
    const matchesClass =
      classId === "all" || item.ma_lop === classId;

    const matchesKeyword =
      `${item.ten_tai_lieu} ${item.mo_ta || ""}`
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());

    return matchesClass && matchesKeyword;
  });

  const openDocument = (value) => {
    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Invalid protocol");
      }

      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch {
      messageApi.error("Đường dẫn tài liệu không hợp lệ");
    }
  };

  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "ten_tai_lieu",
      render: (name) => (
        <Space>
          <FileTextOutlined style={{ color: "#1677ff" }} />
          <strong>{name}</strong>
        </Space>
      )
    },
    {
      title: "Lớp học",
      dataIndex: "ma_lop",
      render: (id) => (
        <Tag color="blue">
          {getStudentClass(id)?.ten_lop || "—"}
        </Tag>
      )
    },
    {
      title: "Ngày đăng",
      dataIndex: "ngay_dang",
      render: formatDate
    },
    {
      title: "Mô tả",
      dataIndex: "mo_ta",
      ellipsis: true,
      render: (value) => value || "—"
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          onClick={() => openDocument(record.duong_dan_file)}
        >
          Mở tài liệu
        </Button>
      )
    }
  ];

  return (
    <div>
      {contextHolder}

      <Typography.Title level={3}>
        Tài liệu học tập
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Tài liệu được cung cấp cho các lớp học của bạn
      </Typography.Paragraph>

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
            placeholder="Tìm kiếm tài liệu..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 270 }}
          />

          <Select
            value={classId}
            onChange={setClassId}
            style={{ width: 230 }}
            options={[
              { value: "all", label: "Tất cả lớp" },
              ...studentClasses.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop
              }))
            ]}
          />
        </Space>

        <Table
          rowKey="ma_tai_lieu"
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "Không tìm thấy tài liệu" }}
        />
      </Card>
    </div>
  );
}
