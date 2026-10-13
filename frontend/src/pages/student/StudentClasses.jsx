
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  Statistic,
  Row,
  Col,
  Space,
  message,
} from "antd";

import {
  SearchOutlined,
  EyeOutlined,
  BookOutlined,
  TeamOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import studentClassService from "../../services/studentClassService";


function formatDate(value) {
  if (!value) return "—";

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed.format("DD/MM/YYYY")
    : "—";
}


function formatTime(value) {
  if (!value) return "—";

  return String(value).slice(0, 5);
}


function getStatusColor(status) {
  switch (status) {
    case "Đang học":
      return "green";

    case "Sắp mở":
      return "orange";

    case "Đã kết thúc":
      return "default";

    default:
      return "blue";
  }
}


function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền xem lớp học này.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy lớp học.";
  }

  return "Không thể tải dữ liệu từ máy chủ.";
}


const initialStats = {
  total_classes: 0,
  active_classes: 0,
};


export default function StudentClasses() {
  const [messageApi, contextHolder] = message.useMessage();

  const [keyword, setKeyword] = useState("");

  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(initialStats);

  const [selected, setSelected] = useState(null);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);


  // 1. Lấy danh sách lớp từ MySQL
  const fetchClasses = useCallback(async () => {
    setLoading(true);

    try {
      const data = await studentClassService.getAll();

      setClasses(data.classes || []);
      setStats(data.stats || initialStats);
    } catch (error) {
      messageApi.error(getErrorMessage(error));

      setClasses([]);
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);


  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);


  // 2. Tìm kiếm lớp hoặc khóa học
  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return classes.filter((item) =>
      `${item.ten_lop} ${item.ten_khoa_hoc}`
        .toLowerCase()
        .includes(search)
    );
  }, [classes, keyword]);


  // 3. Xem chi tiết lớp và lịch học
  const handleViewDetail = async (record) => {
    setSelected(record);
    setSchedules([]);
    setDetailLoading(true);

    try {
      const data = await studentClassService.getById(
        record.ma_lop
      );

      setSelected(data.class_info);
      setSchedules(data.schedules || []);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
      setSelected(null);
      setSchedules([]);
    } finally {
      setDetailLoading(false);
    }
  };


  const closeDetail = () => {
    setSelected(null);
    setSchedules([]);
  };


  const columns = [
    {
      title: "Mã lớp",
      dataIndex: "ma_lop",
      width: 90,
    },
    {
      title: "Tên lớp",
      dataIndex: "ten_lop",
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: "Khóa học",
      dataIndex: "ten_khoa_hoc",
    },
    {
      title: "Giáo viên",
      dataIndex: "giao_vien",
    },
    {
      title: "Thời gian",
      render: (_, record) =>
        `${formatDate(record.ngay_bat_dau)} - ${formatDate(
          record.ngay_ket_thuc
        )}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "trang_thai",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Chi tiết",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Xem
        </Button>
      ),
    },
  ];


  const scheduleColumns = [
    {
      title: "Thứ",
      dataIndex: "thu",
    },
    {
      title: "Thời gian",
      render: (_, record) =>
        `${formatTime(record.gio_bat_dau)} - ${formatTime(
          record.gio_ket_thuc
        )}`,
    },
    {
      title: "Phòng",
      dataIndex: "phong_hoc",
      render: (value) => value || "—",
    },
  ];


  return (
    <div>
      {contextHolder}

      <Typography.Title level={3}>
        Lớp học của tôi
      </Typography.Title>

      <Typography.Paragraph type="secondary">
        Danh sách các lớp học viên đang tham gia
      </Typography.Paragraph>


      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Tổng lớp"
              value={stats.total_classes}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Lớp đang học"
              value={stats.active_classes}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>


      {/* Danh sách lớp */}
      <Card>
        <Space
          wrap
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm lớp hoặc khóa học..."
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            allowClear
            style={{ width: 320, maxWidth: "100%" }}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchClasses}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>

        <Table
          rowKey="ma_lop"
          dataSource={filtered}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: "Bạn chưa tham gia lớp học nào",
          }}
        />
      </Card>


      {/* Chi tiết lớp học */}
      <Modal
        title={`Thông tin lớp ${selected?.ten_lop || ""}`}
        open={Boolean(selected)}
        onCancel={closeDetail}
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

              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(selected.trang_thai)}>
                  {selected.trang_thai}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả">
                Chưa có mô tả
              </Descriptions.Item>
            </Descriptions>

            <Typography.Title
              level={5}
              style={{ marginTop: 20 }}
            >
              Lịch học của lớp
            </Typography.Title>

            <Table
              size="small"
              pagination={false}
              rowKey="ma_lich"
              dataSource={schedules}
              columns={scheduleColumns}
              loading={detailLoading}
              locale={{
                emptyText: "Lớp chưa có lịch học",
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
