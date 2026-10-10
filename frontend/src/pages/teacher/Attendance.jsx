
import { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  DatePicker,
  Table,
  Radio,
  Input,
  Button,
  Space,
  Tag,
  Alert,
  message
} from "antd";

import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  ReloadOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";

const classes = [
  {
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    students: [
      { ma_xep_lop: 101, ma_hoc_vien: 1, ho_ten: "Nguyễn Văn An" },
      { ma_xep_lop: 102, ma_hoc_vien: 2, ho_ten: "Trần Thị Bình" },
      { ma_xep_lop: 103, ma_hoc_vien: 3, ho_ten: "Lê Minh Đức" },
      { ma_xep_lop: 104, ma_hoc_vien: 4, ho_ten: "Phạm Thị Hoa" }
    ]
  },
  {
    ma_lop: 2,
    ten_lop: "IELTS 5.5 - A01",
    students: [
      { ma_xep_lop: 201, ma_hoc_vien: 5, ho_ten: "Hoàng Gia Huy" },
      { ma_xep_lop: 202, ma_hoc_vien: 6, ho_ten: "Đỗ Thu Trang" },
      { ma_xep_lop: 203, ma_hoc_vien: 7, ho_ten: "Bùi Minh Khang" }
    ]
  }
];

// Dữ liệu lưu tạm trên trình duyệt
const STORAGE_KEY = "teacher_attendance_demo";

function loadSavedAttendance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Attendance() {
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedClassId, setSelectedClassId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [savedAttendance, setSavedAttendance] =
    useState(loadSavedAttendance);

  const [draftAttendance, setDraftAttendance] = useState({});

  const [dirty, setDirty] = useState(false);

  const selectedClass = classes.find(
    (item) => item.ma_lop === selectedClassId
  );

  const dateString = selectedDate.format("YYYY-MM-DD");

  const recordKey = `${selectedClassId}_${dateString}`;

  const savedRecords = savedAttendance[recordKey] || {};

  // Nếu đã chỉnh sửa nhưng chưa lưu, ưu tiên dữ liệu đang nhập
  const currentRecords = dirty
    ? draftAttendance
    : savedRecords;

  const students = selectedClass?.students || [];

  const attendanceRows = useMemo(() => {
    return students.map((student) => ({
      ...student,
      trang_thai:
        currentRecords[student.ma_xep_lop]?.trang_thai || null,
      ghi_chu:
        currentRecords[student.ma_xep_lop]?.ghi_chu || ""
    }));
  }, [students, currentRecords]);

  const presentCount = attendanceRows.filter(
    (item) => item.trang_thai === "Có mặt"
  ).length;

  const absentCount = attendanceRows.filter(
    (item) => item.trang_thai === "Vắng mặt"
  ).length;

  const unmarkedCount =
    attendanceRows.length - presentCount - absentCount;

  const isSaved = Boolean(savedAttendance[recordKey]);

  const updateAttendance = (studentId, field, value) => {
    const updated = {
      ...currentRecords,
      [studentId]: {
        ...(currentRecords[studentId] || {}),
        [field]: value
      }
    };

    setDraftAttendance(updated);
    setDirty(true);
  };

  const handleClassChange = (value) => {
    setSelectedClassId(value);
    setDraftAttendance({});
    setDirty(false);
  };

  const handleDateChange = (date) => {
    if (!date) return;

    setSelectedDate(date);
    setDraftAttendance({});
    setDirty(false);
  };

  const markAllPresent = () => {
    const updated = {};

    students.forEach((student) => {
      updated[student.ma_xep_lop] = {
        trang_thai: "Có mặt",
        ghi_chu:
          currentRecords[student.ma_xep_lop]?.ghi_chu || ""
      };
    });

    setDraftAttendance(updated);
    setDirty(true);
  };

  const resetDraft = () => {
    setDraftAttendance({});
    setDirty(false);
    messageApi.info("Đã khôi phục dữ liệu đã lưu");
  };

  const handleSave = () => {
    if (unmarkedCount > 0) {
      messageApi.warning(
        `Còn ${unmarkedCount} học viên chưa được điểm danh`
      );
      return;
    }

    const updated = {
      ...savedAttendance,
      [recordKey]: currentRecords
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setSavedAttendance(updated);
      setDraftAttendance({});
      setDirty(false);

      messageApi.success("Lưu điểm danh thành công!");
    } catch {
      messageApi.error("Không thể lưu dữ liệu trên trình duyệt");
    }
  };

  const columns = [
    {
      title: "STT",
      width: 70,
      render: (_, __, index) => index + 1
    },
    {
      title: "Mã học viên",
      dataIndex: "ma_hoc_vien",
      width: 130
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      render: (name) => <strong>{name}</strong>
    },
    {
      title: "Điểm danh",
      width: 250,
      render: (_, record) => (
        <Radio.Group
          value={record.trang_thai}
          onChange={(event) =>
            updateAttendance(
              record.ma_xep_lop,
              "trang_thai",
              event.target.value
            )
          }
        >
          <Radio value="Có mặt">Có mặt</Radio>
          <Radio value="Vắng mặt">Vắng mặt</Radio>
        </Radio.Group>
      )
    },
    {
      title: "Ghi chú",
      render: (_, record) => (
        <Input
          placeholder="Nhập ghi chú..."
          value={record.ghi_chu}
          onChange={(event) =>
            updateAttendance(
              record.ma_xep_lop,
              "ghi_chu",
              event.target.value
            )
          }
        />
      )
    }
  ];

  return (
    <div>
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Điểm danh học viên
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý tình trạng tham gia học tập theo lớp và ngày học
        </Typography.Text>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Space wrap size="large">
          <div>
            <Typography.Text strong>
              Chọn lớp học
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              <Select
                value={selectedClassId}
                onChange={handleClassChange}
                style={{ width: 250 }}
                options={classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop
                }))}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>
              Ngày học
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>
              Trạng thái lưu
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              {dirty ? (
                <Tag color="orange">Chưa lưu thay đổi</Tag>
              ) : isSaved ? (
                <Tag color="green">Đã lưu</Tag>
              ) : (
                <Tag>Chưa điểm danh</Tag>
              )}
            </div>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={students.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Có mặt"
              value={presentCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Vắng mặt"
              value={absentCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Chưa điểm danh"
              value={unmarkedCount}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {dirty && (
        <Alert
          type="warning"
          showIcon
          message="Bạn có thay đổi chưa lưu. Chuyển lớp hoặc ngày sẽ hủy các thay đổi này."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={`Danh sách học viên - ${selectedClass?.ten_lop}`}
        extra={
          <Space wrap>
            <Button onClick={markAllPresent}>
              Tất cả có mặt
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={resetDraft}
              disabled={!dirty}
            >
              Hoàn tác
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!students.length}
            >
              Lưu điểm danh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={attendanceRows}
          rowKey="ma_xep_lop"
          pagination={false}
          scroll={{ x: 850 }}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            Đã điểm danh {presentCount + absentCount}/
            {students.length} học viên
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
