
import { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Input,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Popconfirm,
  message,
  Empty
} from "antd";

import {
  FileTextOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";

const { TextArea } = Input;

const STORAGE_KEY = "teacher_documents_demo";

const classes = [
  {
    ma_lop: 1,
    ten_lop: "Giao tiếp A01"
  },
  {
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01"
  }
];

const initialDocuments = [
  {
    ma_tai_lieu: 1,
    ma_lop: 1,
    ten_tai_lieu: "Từ vựng giao tiếp cơ bản",
    duong_dan_file: "https://example.com/giao-tiep-tu-vung.pdf",
    ngay_dang: "2026-09-20",
    mo_ta: "Tài liệu từ vựng dành cho học viên lớp Giao tiếp A01"
  },
  {
    ma_tai_lieu: 2,
    ma_lop: 1,
    ten_tai_lieu: "Bài tập luyện hội thoại",
    duong_dan_file: "https://example.com/bai-tap-hoi-thoai.pdf",
    ngay_dang: "2026-09-25",
    mo_ta: "Bài tập thực hành giao tiếp"
  },
  {
    ma_tai_lieu: 3,
    ma_lop: 2,
    ten_tai_lieu: "IELTS Speaking Practice",
    duong_dan_file: "https://example.com/ielts-speaking.pdf",
    ngay_dang: "2026-10-01",
    mo_ta: "Tài liệu luyện Speaking IELTS"
  }
];

function loadDocuments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return initialDocuments;

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : initialDocuments;
  } catch {
    return initialDocuments;
  }
}

function getClassName(classId) {
  return (
    classes.find((item) => item.ma_lop === classId)
      ?.ten_lop || "Không xác định"
  );
}

export default function TeacherDocuments() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [documents, setDocuments] = useState(loadDocuments);
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  const filteredDocuments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return documents.filter((item) => {
      const matchClass =
        selectedClass === "all" ||
        item.ma_lop === selectedClass;

      const matchSearch = item.ten_tai_lieu
        .toLowerCase()
        .includes(keyword);

      return matchClass && matchSearch;
    });
  }, [documents, selectedClass, searchText]);

  const saveToStorage = (updated) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setDocuments(updated);
      return true;
    } catch {
      messageApi.error("Không thể lưu dữ liệu trên trình duyệt");
      return false;
    }
  };

  const openAddModal = () => {
    setEditingDocument(null);

    form.resetFields();

    if (selectedClass !== "all") {
      form.setFieldsValue({
        ma_lop: selectedClass
      });
    }

    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingDocument(record);

    form.setFieldsValue({
      ma_lop: record.ma_lop,
      ten_tai_lieu: record.ten_tai_lieu,
      duong_dan_file: record.duong_dan_file,
      mo_ta: record.mo_ta
    });

    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingDocument) {
      const updated = documents.map((item) =>
        item.ma_tai_lieu === editingDocument.ma_tai_lieu
          ? { ...item, ...values }
          : item
      );

      if (saveToStorage(updated)) {
        messageApi.success("Cập nhật tài liệu thành công");
        setModalOpen(false);
      }

      return;
    }

    const nextId =
      documents.reduce(
        (max, item) => Math.max(max, item.ma_tai_lieu),
        0
      ) + 1;

    const newDocument = {
      ma_tai_lieu: nextId,
      ...values,
      ngay_dang: dayjs().format("YYYY-MM-DD")
    };

    const updated = [newDocument, ...documents];

    if (saveToStorage(updated)) {
      messageApi.success("Thêm tài liệu thành công");
      setModalOpen(false);
    }
  };

  const handleDelete = (documentId) => {
    const updated = documents.filter(
      (item) => item.ma_tai_lieu !== documentId
    );

    if (saveToStorage(updated)) {
      messageApi.success("Đã xóa tài liệu");
    }
  };

  const openDocument = (url) => {
    try {
      const parsed = new URL(url);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        messageApi.error("Đường dẫn không hợp lệ");
        return;
      }

      window.open(parsed.href, "_blank", "noopener,noreferrer");
    } catch {
      messageApi.error("Đường dẫn không hợp lệ");
    }
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "ma_tai_lieu",
      width: 80
    },
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
      render: (classId) => (
        <Tag color="blue">
          {getClassName(classId)}
        </Tag>
      )
    },
    {
      title: "Ngày đăng",
      dataIndex: "ngay_dang",
      render: (date) =>
        dayjs(date).format("DD/MM/YYYY")
    },
    {
      title: "Mô tả",
      dataIndex: "mo_ta",
      ellipsis: true,
      render: (value) => value || "—"
    },
    {
      title: "Thao tác",
      width: 230,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() =>
              openDocument(record.duong_dan_file)
            }
          >
            Mở
          </Button>

          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />

          <Popconfirm
            title="Xóa tài liệu?"
            description="Bạn có chắc chắn muốn xóa tài liệu này?"
            onConfirm={() =>
              handleDelete(record.ma_tai_lieu)
            }
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Tài liệu lớp học
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý tài liệu học tập của các lớp được phân công
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Tổng tài liệu"
              value={documents.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Lớp phụ trách"
              value={classes.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#52c41a" }}
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
            marginBottom: 20
          }}
        >
          <Space wrap>
            <Input
              placeholder="Tìm tên tài liệu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />

            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 220 }}
              options={[
                {
                  value: "all",
                  label: "Tất cả lớp"
                },
                ...classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop
                }))
              ]}
            />
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
          >
            Thêm tài liệu
          </Button>
        </Space>

        {filteredDocuments.length ? (
          <Table
            columns={columns}
            dataSource={filteredDocuments}
            rowKey="ma_tai_lieu"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 900 }}
          />
        ) : (
          <Empty description="Không tìm thấy tài liệu" />
        )}
      </Card>

      <Modal
        title={
          editingDocument
            ? "Chỉnh sửa tài liệu"
            : "Thêm tài liệu mới"
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingDocument ? "Cập nhật" : "Thêm tài liệu"}
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="ma_lop"
            label="Lớp học"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn lớp"
              }
            ]}
          >
            <Select
              placeholder="Chọn lớp học"
              options={classes.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop
              }))}
            />
          </Form.Item>

          <Form.Item
            name="ten_tai_lieu"
            label="Tên tài liệu"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên tài liệu"
              }
            ]}
          >
            <Input placeholder="Ví dụ: Bài tập Unit 1" />
          </Form.Item>

          <Form.Item
            name="duong_dan_file"
            label="Đường dẫn tài liệu"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập đường dẫn"
              },
              {
                type: "url",
                message: "Vui lòng nhập URL hợp lệ"
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  try {
                    const url = new URL(value);

                    if (["http:", "https:"].includes(url.protocol)) {
                      return Promise.resolve();
                    }
                  } catch {
                    // URL không hợp lệ
                  }

                  return Promise.reject(
                    new Error("Chỉ hỗ trợ liên kết HTTP hoặc HTTPS")
                  );
                }
              }
            ]}
          >
            <Input placeholder="https://example.com/tai-lieu.pdf" />
          </Form.Item>

          <Form.Item
            name="mo_ta"
            label="Mô tả"
          >
            <TextArea
              rows={3}
              placeholder="Nhập mô tả tài liệu..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
