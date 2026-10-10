
import { useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Card,
  Typography,
  Popconfirm,
  message,
} from "antd";

import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const initialData = [
  {
    ma_hoc_vien: 1,
    ho_ten: "Nguyễn Văn An",
    ngay_sinh: "2005-03-15",
    gioi_tinh: "Nam",
    email: "an@gmail.com",
    so_dien_thoai: "0912345678",
    dia_chi: "Hà Nội",
    trang_thai: "Đang học",
  },
  {
    ma_hoc_vien: 2,
    ho_ten: "Trần Thị Bình",
    ngay_sinh: "2004-08-20",
    gioi_tinh: "Nữ",
    email: "binh@gmail.com",
    so_dien_thoai: "0987654321",
    dia_chi: "Thanh Hóa",
    trang_thai: "Đang học",
  },
];

export default function HocVien() {
  const [students, setStudents] = useState(initialData);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [form] = Form.useForm();

  const filteredStudents = students.filter((student) => {
    const keyword = searchText.toLowerCase();

    return (
      student.ho_ten.toLowerCase().includes(keyword) ||
      (student.email || "").toLowerCase().includes(keyword) ||
      (student.so_dien_thoai || "").includes(keyword)
    );
  });

  const handleAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);

    form.setFieldsValue({
      ...student,
    });

    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingStudent) {
        setStudents((prev) =>
          prev.map((student) =>
            student.ma_hoc_vien === editingStudent.ma_hoc_vien
              ? { ...student, ...values }
              : student
          )
        );

        message.success("Cập nhật học viên thành công!");
      } else {
        const newStudent = {
          ...values,
          ma_hoc_vien: Date.now(),
        };

        setStudents((prev) => [...prev, newStudent]);

        message.success("Thêm học viên thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch {
      // Form chưa hợp lệ, Ant Design sẽ hiển thị lỗi.
    }
  };

  const handleDelete = (id) => {
    setStudents((prev) =>
      prev.filter((student) => student.ma_hoc_vien !== id)
    );

    message.success("Đã xóa học viên khỏi danh sách!");
  };

  const columns = [
    {
      title: "Mã HV",
      dataIndex: "ma_hoc_vien",
      key: "ma_hoc_vien",
      width: 90,
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      key: "ho_ten",
    },
    {
      title: "Giới tính",
      dataIndex: "gioi_tinh",
      key: "gioi_tinh",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai",
      key: "so_dien_thoai",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      key: "trang_thai",
      render: (status) => (
        <Tag color={status === "Đang học" ? "green" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setViewingStudent(record)}
          />

          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Xóa học viên?"
            description="Anh có chắc muốn xóa học viên này?"
            onConfirm={() => handleDelete(record.ma_hoc_vien)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3}>
        Quản lý học viên
      </Typography.Title>

      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
          wrap
        >
          <Input
            placeholder="Tìm kiếm học viên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm học viên
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="ma_hoc_vien"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          editingStudent
            ? "Cập nhật học viên"
            : "Thêm học viên mới"
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="ho_ten"
            label="Họ và tên"
            rules={[
              { required: true, message: "Nhập họ tên!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="gioi_tinh"
            label="Giới tính"
          >
            <Select
              options={[
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
                { value: "Khác", label: "Khác" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="so_dien_thoai"
            label="Số điện thoại"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ngay_sinh"
            label="Ngày sinh (YYYY-MM-DD)"
          >
            <Input placeholder="2005-12-07" />
          </Form.Item>

          <Form.Item
            name="dia_chi"
            label="Địa chỉ"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="trang_thai"
            label="Trạng thái"
            initialValue="Đang học"
          >
            <Select
              options={[
                {
                  value: "Đang học",
                  label: "Đang học",
                },
                {
                  value: "Ngừng học",
                  label: "Ngừng học",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thông tin học viên"
        open={!!viewingStudent}
        onCancel={() => setViewingStudent(null)}
        footer={null}
      >
        {viewingStudent && (
          <div style={{ lineHeight: 2 }}>
            <p><b>Họ tên:</b> {viewingStudent.ho_ten}</p>
            <p><b>Ngày sinh:</b> {viewingStudent.ngay_sinh}</p>
            <p><b>Giới tính:</b> {viewingStudent.gioi_tinh}</p>
            <p><b>Email:</b> {viewingStudent.email}</p>
            <p><b>Số điện thoại:</b> {viewingStudent.so_dien_thoai}</p>
            <p><b>Địa chỉ:</b> {viewingStudent.dia_chi}</p>
            <p><b>Trạng thái:</b> {viewingStudent.trang_thai}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}