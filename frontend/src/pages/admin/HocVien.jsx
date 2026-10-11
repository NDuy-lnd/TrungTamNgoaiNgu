
import { useCallback, useEffect, useState } from "react";

import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Card,
  Typography,
  Popconfirm,
  message,
} from "antd";

import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import hocVienService from "../../services/hocVienService";


function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền quản lý học viên.";
  }

  return "Có lỗi xảy ra khi kết nối với máy chủ.";
}


export default function HocVien() {
  const [students, setStudents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();


  // ==========================================
  // 1. LẤY DANH SÁCH TỪ MYSQL
  // ==========================================

  const fetchStudents = useCallback(async () => {
    setLoading(true);

    try {
      const result = await hocVienService.getAll({
        search,
        page,
        page_size: pageSize,
      });

      setStudents(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, messageApi]);


  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);


  // ==========================================
  // 2. TÌM KIẾM
  // ==========================================

  const handleSearch = (value) => {
    setSearch(value.trim());
    setPage(1);
  };


  // ==========================================
  // 3. MỞ FORM THÊM
  // ==========================================

  const handleAdd = () => {
    setEditingStudent(null);

    form.resetFields();

    form.setFieldsValue({
      trang_thai: true,
    });

    setIsModalOpen(true);
  };


  // ==========================================
  // 4. MỞ FORM SỬA
  // ==========================================

  const handleEdit = (student) => {
    setEditingStudent(student);

    form.resetFields();

    form.setFieldsValue({
      ho_ten: student.ho_ten,
      ngay_sinh: student.ngay_sinh,
      gioi_tinh: student.gioi_tinh,
      email: student.email,
      so_dien_thoai: student.so_dien_thoai,
      dia_chi: student.dia_chi,
      trang_thai: student.trang_thai,
    });

    setIsModalOpen(true);
  };


  // ==========================================
  // 5. THÊM / SỬA VÀ LƯU MYSQL
  // ==========================================

  const handleSave = async () => {
    let values;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...values,
        ho_ten: values.ho_ten.trim(),
        ngay_sinh: values.ngay_sinh || null,
        email: values.email?.trim() || null,
        so_dien_thoai: values.so_dien_thoai?.trim() || null,
        dia_chi: values.dia_chi?.trim() || null,
        gioi_tinh: values.gioi_tinh || null,
      };

      if (editingStudent) {
        await hocVienService.update(
          editingStudent.ma_hoc_vien,
          payload
        );

        messageApi.success("Cập nhật học viên thành công!");
      } else {
        await hocVienService.create({
          ...payload,
          ten_dang_nhap: values.ten_dang_nhap.trim(),
          mat_khau: values.mat_khau,
        });

        messageApi.success("Thêm học viên thành công!");
      }

      setIsModalOpen(false);
      setEditingStudent(null);
      form.resetFields();

      if (!editingStudent && page !== 1) {
        setPage(1);
      } else {
        await fetchStudents();
      }
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // 6. KHÓA / MỞ TÀI KHOẢN
  // ==========================================

  const handleChangeStatus = async (student) => {
    const newStatus = !student.trang_thai;

    try {
      await hocVienService.changeStatus(
        student.ma_hoc_vien,
        newStatus
      );

      messageApi.success(
        newStatus
          ? "Đã mở lại tài khoản học viên!"
          : "Đã khóa tài khoản học viên!"
      );

      await fetchStudents();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  };


  // ==========================================
  // 7. CỘT BẢNG
  // ==========================================

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
      render: (value) => value || "—",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value) => value || "—",
    },
    {
      title: "Số điện thoại",
      dataIndex: "so_dien_thoai",
      key: "so_dien_thoai",
      render: (value) => value || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      key: "trang_thai",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Đang học" : "Ngừng học"}
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
            title="Xem chi tiết"
            onClick={() => setViewingStudent(record)}
          />

          <Button
            icon={<EditOutlined />}
            title="Chỉnh sửa"
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title={
              record.trang_thai
                ? "Khóa tài khoản học viên?"
                : "Mở lại tài khoản học viên?"
            }
            description={
              record.trang_thai
                ? "Học viên sẽ không thể đăng nhập."
                : "Học viên sẽ có thể đăng nhập trở lại."
            }
            onConfirm={() => handleChangeStatus(record)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger={record.trang_thai}
              icon={
                record.trang_thai
                  ? <LockOutlined />
                  : <UnlockOutlined />
              }
              title={
                record.trang_thai
                  ? "Khóa tài khoản"
                  : "Mở tài khoản"
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];


  // ==========================================
  // 8. GIAO DIỆN
  // ==========================================

  return (
    <div>
      {contextHolder}

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
          <Input.Search
            placeholder="Tìm tên, mã HV, email, số điện thoại..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              const value = e.target.value;
              setSearchText(value);

              if (!value) {
                handleSearch("");
              }
            }}
            onSearch={handleSearch}
            style={{ width: 330 }}
            allowClear
            enterButton
          />

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStudents}
              loading={loading}
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Thêm học viên
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={students}
          rowKey="ma_hoc_vien"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["8", "10", "20", "50"],
            showTotal: (count) => `Tổng ${count} học viên`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>

      {/* FORM THÊM / SỬA */}

      <Modal
        title={
          editingStudent
            ? "Cập nhật học viên"
            : "Thêm học viên mới"
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        okButtonProps={{ disabled: saving }}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={{ trang_thai: true }}
        >
          <Form.Item
            name="ho_ten"
            label="Họ và tên"
            rules={[
              { required: true, whitespace: true, message: "Nhập họ tên!" },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            name="gioi_tinh"
            label="Giới tính"
          >
            <Select
              allowClear
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
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            name="so_dien_thoai"
            label="Số điện thoại"
            rules={[
              {
                pattern: /^[0-9]{9,15}$/,
                message: "Số điện thoại phải gồm 9–15 chữ số!",
              },
            ]}
          >
            <Input maxLength={15} />
          </Form.Item>

          <Form.Item
            name="ngay_sinh"
            label="Ngày sinh (YYYY-MM-DD)"
            rules={[
              {
                pattern: /^\d{4}-\d{2}-\d{2}$/,
                message: "Nhập ngày theo dạng YYYY-MM-DD!",
              },
            ]}
          >
            <Input placeholder="2005-12-07" />
          </Form.Item>

          <Form.Item
            name="dia_chi"
            label="Địa chỉ"
          >
            <Input maxLength={255} />
          </Form.Item>

          {!editingStudent && (
            <>
              <Form.Item
                name="ten_dang_nhap"
                label="Tên đăng nhập"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Nhập tên đăng nhập!",
                  },
                  {
                    min: 3,
                    message: "Tên đăng nhập tối thiểu 3 ký tự!",
                  },
                ]}
              >
                <Input
                  placeholder="Ví dụ: HV061"
                  maxLength={50}
                />
              </Form.Item>

              <Form.Item
                name="mat_khau"
                label="Mật khẩu"
                rules={[
                  {
                    required: true,
                    message: "Nhập mật khẩu!",
                  },
                  {
                    min: 8,
                    message: "Mật khẩu tối thiểu 8 ký tự!",
                  },
                ]}
              >
                <Input.Password
                  placeholder="Tối thiểu 8 ký tự"
                  maxLength={128}
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="trang_thai"
            label="Trạng thái"
          >
            <Select
              options={[
                { value: true, label: "Đang học" },
                { value: false, label: "Ngừng học" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* XEM CHI TIẾT */}

      <Modal
        title="Thông tin học viên"
        open={!!viewingStudent}
        onCancel={() => setViewingStudent(null)}
        footer={null}
      >
        {viewingStudent && (
          <div style={{ lineHeight: 2 }}>
            <p>
              <b>Mã học viên:</b>{" "}
              {viewingStudent.ma_hoc_vien}
            </p>

            <p>
              <b>Họ tên:</b>{" "}
              {viewingStudent.ho_ten}
            </p>

            <p>
              <b>Tên đăng nhập:</b>{" "}
              {viewingStudent.ten_dang_nhap || "Chưa có tài khoản"}
            </p>

            <p>
              <b>Ngày sinh:</b>{" "}
              {viewingStudent.ngay_sinh || "—"}
            </p>

            <p>
              <b>Giới tính:</b>{" "}
              {viewingStudent.gioi_tinh || "—"}
            </p>

            <p>
              <b>Email:</b>{" "}
              {viewingStudent.email || "—"}
            </p>

            <p>
              <b>Số điện thoại:</b>{" "}
              {viewingStudent.so_dien_thoai || "—"}
            </p>

            <p>
              <b>Địa chỉ:</b>{" "}
              {viewingStudent.dia_chi || "—"}
            </p>

            <p>
              <b>Trạng thái:</b>{" "}
              {viewingStudent.trang_thai
                ? "Đang học"
                : "Ngừng học"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
