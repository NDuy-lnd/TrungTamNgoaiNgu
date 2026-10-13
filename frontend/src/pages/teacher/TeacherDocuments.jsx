
import { useCallback, useEffect, useMemo, useState } from "react";

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
} from "antd";

import {
  FileTextOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import teacherDocumentService from "../../services/teacherDocumentService";

const { TextArea } = Input;

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền quản lý tài liệu này.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy tài liệu hoặc lớp học.";
  }

  return "Không thể kết nối đến máy chủ.";
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export default function TeacherDocuments() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [classes, setClasses] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedClass, setSelectedClass] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 1. Lấy danh sách lớp và tài liệu từ MySQL
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [classData, documentData] = await Promise.all([
        teacherDocumentService.getClasses(),
        teacherDocumentService.getAll(),
      ]);

      setClasses(classData || []);
      setDocuments(documentData || []);

      setSelectedClass((previous) => {
        if (previous === "all") return previous;

        return (classData || []).some(
          (item) => item.ma_lop === previous
        )
          ? previous
          : "all";
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Tìm kiếm và lọc tài liệu
  const filteredDocuments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return documents.filter((item) => {
      const matchClass =
        selectedClass === "all" ||
        item.ma_lop === selectedClass;

      const matchSearch =
        (item.ten_tai_lieu || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mo_ta || "")
          .toLowerCase()
          .includes(keyword);

      return matchClass && matchSearch;
    });
  }, [documents, selectedClass, searchText]);

  const getClassName = (classId) => {
    return (
      classes.find((item) => item.ma_lop === classId)
        ?.ten_lop || "Không xác định"
    );
  };

  // 3. Mở modal thêm tài liệu
  const openAddModal = () => {
    setEditingDocument(null);
    form.resetFields();

    if (selectedClass !== "all") {
      form.setFieldsValue({
        ma_lop: selectedClass,
      });
    }

    setModalOpen(true);
  };

  // 4. Mở modal chỉnh sửa
  const openEditModal = (record) => {
    setEditingDocument(record);

    form.setFieldsValue({
      ma_lop: record.ma_lop,
      ten_tai_lieu: record.ten_tai_lieu,
      duong_dan_file: record.duong_dan_file,
      mo_ta: record.mo_ta || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setEditingDocument(null);
    form.resetFields();
  };

  // 5. Xem chi tiết tài liệu
  const openDetailModal = (record) => {
    setSelectedDocument(record);
    setDetailOpen(true);
  };

  // 6. Thêm hoặc sửa tài liệu
  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        ma_lop: values.ma_lop,
        ten_tai_lieu: values.ten_tai_lieu.trim(),
        duong_dan_file: values.duong_dan_file.trim(),
        mo_ta: values.mo_ta?.trim() || null,
      };

      if (editingDocument) {
        await teacherDocumentService.update(
          editingDocument.ma_tai_lieu,
          payload
        );

        messageApi.success("Cập nhật tài liệu thành công");
      } else {
        await teacherDocumentService.create(payload);

        messageApi.success("Thêm tài liệu thành công");
      }

      closeModalAfterSubmit();
      await fetchData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const closeModalAfterSubmit = () => {
    setModalOpen(false);
    setEditingDocument(null);
    form.resetFields();
  };

  // 7. Xóa tài liệu
  const handleDelete = async (documentId) => {
    setDeletingId(documentId);

    try {
      await teacherDocumentService.delete(documentId);

      messageApi.success("Xóa tài liệu thành công");
      await fetchData();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  // 8. Mở liên kết tài liệu
  const openDocument = (url) => {
    if (!isValidHttpUrl(url)) {
      messageApi.error("Đường dẫn tài liệu không hợp lệ");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "ma_tai_lieu",
      width: 80,
      sorter: (a, b) => a.ma_tai_lieu - b.ma_tai_lieu,
    },
    {
      title: "Tên tài liệu",
      dataIndex: "ten_tai_lieu",
      render: (name) => (
        <Space>
          <FileTextOutlined
            style={{ color: "#1677ff" }}
          />
          <Typography.Text strong>
            {name}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",
      render: (name) => (
        <Tag color="blue">{name}</Tag>
      ),
    },
    {
      title: "Ngày đăng",
      dataIndex: "ngay_dang",
      render: (value) =>
        value
          ? dayjs(value).format("DD/MM/YYYY HH:mm")
          : "—",
      sorter: (a, b) =>
        dayjs(a.ngay_dang).valueOf() -
        dayjs(b.ngay_dang).valueOf(),
    },
    {
      title: "Mô tả",
      dataIndex: "mo_ta",
      ellipsis: true,
      render: (value) => value || "—",
    },
    {
      title: "Thao tác",
      width: 245,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            title="Xem chi tiết"
            onClick={() => openDetailModal(record)}
          />

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
            title="Chỉnh sửa"
            onClick={() => openEditModal(record)}
            disabled={deletingId !== null}
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
              title="Xóa"
              loading={
                deletingId === record.ma_tai_lieu
              }
              disabled={
                deletingId !== null &&
                deletingId !== record.ma_tai_lieu
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Tài liệu lớp học
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý tài liệu học tập của các lớp được phân công
        </Typography.Text>
      </div>

      {/* Thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} md={12}>
          <Card loading={loading}>
            <Statistic
              title="Tổng tài liệu"
              value={documents.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card loading={loading}>
            <Statistic
              title="Lớp phụ trách"
              value={classes.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng tài liệu */}
      <Card>
        <Space
          wrap
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Space wrap>
            <Input
              placeholder="Tìm tên hoặc mô tả tài liệu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              allowClear
              style={{ width: 270 }}
            />

            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 220 }}
              showSearch
              optionFilterProp="label"
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
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              disabled={
                classes.length === 0 || loading
              }
            >
              Thêm tài liệu
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredDocuments}
          rowKey="ma_tai_lieu"
          loading={loading}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
          }}
          scroll={{ x: 950 }}
          locale={{
            emptyText: "Không tìm thấy tài liệu",
          }}
        />
      </Card>

      {/* Modal thêm / sửa tài liệu */}
      <Modal
        title={
          editingDocument
            ? "Chỉnh sửa tài liệu"
            : "Thêm tài liệu mới"
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={
          editingDocument
            ? "Cập nhật"
            : "Thêm tài liệu"
        }
        cancelText="Hủy"
        confirmLoading={submitting}
        okButtonProps={{
          disabled: submitting,
        }}
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
                message: "Vui lòng chọn lớp học",
              },
            ]}
          >
            <Select
              placeholder="Chọn lớp học"
              showSearch
              optionFilterProp="label"
              options={classes.map((item) => ({
                value: item.ma_lop,
                label: item.ten_lop,
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
                message: "Vui lòng nhập tên tài liệu",
              },
              {
                max: 255,
                message: "Tên tối đa 255 ký tự",
              },
            ]}
          >
            <Input
              placeholder="Ví dụ: Bài tập Unit 1"
              maxLength={255}
            />
          </Form.Item>

          <Form.Item
            name="duong_dan_file"
            label="Đường dẫn tài liệu"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập đường dẫn",
              },
              {
                validator: (_, value) => {
                  if (
                    !value ||
                    isValidHttpUrl(value.trim())
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "Chỉ hỗ trợ liên kết HTTP hoặc HTTPS hợp lệ"
                    )
                  );
                },
              },
            ]}
          >
            <Input
              placeholder="https://example.com/tai-lieu.pdf"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="mo_ta"
            label="Mô tả"
            rules={[
              {
                max: 500,
                message: "Mô tả tối đa 500 ký tự",
              },
            ]}
          >
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="Nhập mô tả tài liệu..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xem chi tiết */}
      <Modal
        title="Chi tiết tài liệu"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setDetailOpen(false)}
          >
            Đóng
          </Button>,
          <Button
            key="open"
            type="primary"
            icon={<LinkOutlined />}
            onClick={() =>
              openDocument(
                selectedDocument?.duong_dan_file
              )
            }
          >
            Mở tài liệu
          </Button>,
        ]}
      >
        {selectedDocument && (
          <Space
            direction="vertical"
            size="middle"
            style={{ width: "100%" }}
          >
            <div>
              <Typography.Text type="secondary">
                Mã tài liệu
              </Typography.Text>
              <div>
                {selectedDocument.ma_tai_lieu}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Tên tài liệu
              </Typography.Text>
              <div>
                <Typography.Text strong>
                  {selectedDocument.ten_tai_lieu}
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Lớp học
              </Typography.Text>
              <div>
                <Tag color="blue">
                  {getClassName(
                    selectedDocument.ma_lop
                  )}
                </Tag>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Ngày đăng
              </Typography.Text>
              <div>
                {selectedDocument.ngay_dang
                  ? dayjs(
                      selectedDocument.ngay_dang
                    ).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Đường dẫn
              </Typography.Text>
              <div style={{ overflowWrap: "anywhere" }}>
                <Typography.Text copyable>
                  {selectedDocument.duong_dan_file}
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text type="secondary">
                Mô tả
              </Typography.Text>
              <div>
                {selectedDocument.mo_ta || "Không có mô tả"}
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
