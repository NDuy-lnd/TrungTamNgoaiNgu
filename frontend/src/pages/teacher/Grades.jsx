
import { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Table,
  InputNumber,
  Button,
  Space,
  Tag,
  Alert,
  message,
  Popconfirm
} from "antd";

import {
  BookOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined
} from "@ant-design/icons";

// Dữ liệu mẫu - đồng nhất với trang Điểm danh
const classes = [
  {
    ma_lop: 1,
    ten_lop: "Giao tiếp A01",
    khoa_hoc: "Tiếng Anh giao tiếp cơ bản",
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
    khoa_hoc: "Luyện thi IELTS 5.5",
    students: [
      { ma_xep_lop: 201, ma_hoc_vien: 5, ho_ten: "Hoàng Gia Huy" },
      { ma_xep_lop: 202, ma_hoc_vien: 6, ho_ten: "Đỗ Thu Trang" },
      { ma_xep_lop: 203, ma_hoc_vien: 7, ho_ten: "Bùi Minh Khang" }
    ]
  }
];

const STORAGE_KEY = "teacher_grades_demo";

function loadSavedGrades() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};
  } catch {
    return {};
  }
}

function getClassification(score) {
  if (score === null || score === undefined) {
    return { text: "Chưa có điểm", color: "default" };
  }

  if (score >= 8.5) {
    return { text: "Giỏi", color: "green" };
  }

  if (score >= 7) {
    return { text: "Khá", color: "blue" };
  }

  if (score >= 5) {
    return { text: "Trung bình", color: "orange" };
  }

  return { text: "Chưa đạt", color: "red" };
}

export default function Grades() {
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedClassId, setSelectedClassId] = useState(1);

  const [savedGrades, setSavedGrades] =
    useState(loadSavedGrades);

  const [draftGrades, setDraftGrades] = useState({});

  const [editing, setEditing] = useState(false);

  const selectedClass = classes.find(
    (item) => item.ma_lop === selectedClassId
  );

  const students = selectedClass?.students || [];

  // Chỉ lấy điểm thuộc lớp đang chọn
  const gradeRows = useMemo(() => {
    return students.map((student) => {
      const key = String(student.ma_xep_lop);

      const score = Object.prototype.hasOwnProperty.call(
        draftGrades,
        key
      )
        ? draftGrades[key]
        : savedGrades[key] ?? null;

      return {
        ...student,
        diem_tong_ket: score
      };
    });
  }, [students, savedGrades, draftGrades]);

  const gradedStudents = gradeRows.filter(
    (item) => item.diem_tong_ket !== null
  );

  const averageScore = gradedStudents.length
    ? gradedStudents.reduce(
        (sum, item) => sum + item.diem_tong_ket,
        0
      ) / gradedStudents.length
    : null;

  const passedStudents = gradedStudents.filter(
    (item) => item.diem_tong_ket >= 5
  ).length;

  const handleScoreChange = (studentId, value) => {
    setDraftGrades((prev) => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setDraftGrades({});
    setEditing(false);
  };

  const handleSave = () => {
    const invalid = Object.values(draftGrades).some(
      (value) =>
        value !== null &&
        (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 10
        )
    );

    if (invalid) {
      messageApi.error("Điểm phải nằm trong khoảng từ 0 đến 10");
      return;
    }

    const updated = { ...savedGrades };

    Object.entries(draftGrades).forEach(([key, value]) => {
      if (value === null) {
        delete updated[key];
      } else {
        updated[key] = value;
      }
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setSavedGrades(updated);
      setDraftGrades({});
      setEditing(false);

      messageApi.success("Lưu điểm thành công!");
    } catch {
      messageApi.error("Không thể lưu điểm trên trình duyệt");
    }
  };

  const handleCancel = () => {
    setDraftGrades({});
    setEditing(false);
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
      title: "Điểm tổng kết",
      width: 180,
      render: (_, record) =>
        editing ? (
          <InputNumber
            min={0}
            max={10}
            precision={2}
            step={0.25}
            value={record.diem_tong_ket}
            onChange={(value) =>
              handleScoreChange(
                record.ma_xep_lop,
                value
              )
            }
            placeholder="Nhập điểm"
            style={{ width: 125 }}
          />
        ) : record.diem_tong_ket !== null ? (
          <Typography.Text strong>
            {record.diem_tong_ket.toFixed(2)}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            Chưa nhập
          </Typography.Text>
        )
    },
    {
      title: "Xếp loại",
      render: (_, record) => {
        const result = getClassification(
          record.diem_tong_ket
        );

        return (
          <Tag color={result.color}>
            {result.text}
          </Tag>
        );
      }
    },
    {
      title: "Kết quả",
      render: (_, record) => {
        const score = record.diem_tong_ket;

        if (score === null) {
          return <Tag>Chưa có kết quả</Tag>;
        }

        return score >= 5 ? (
          <Tag color="success">Đạt</Tag>
        ) : (
          <Tag color="error">Chưa đạt</Tag>
        );
      }
    }
  ];

  return (
    <div>
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Quản lý điểm
        </Typography.Title>

        <Typography.Text type="secondary">
          Nhập và cập nhật điểm tổng kết cho học viên
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
                disabled={editing}
                style={{ width: 260 }}
                options={classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop
                }))}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>
              Khóa học
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              <Tag color="blue">
                {selectedClass?.khoa_hoc}
              </Tag>
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
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Đã có điểm"
              value={gradedStudents.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={averageScore ?? "—"}
              precision={averageScore === null ? undefined : 2}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Học viên đạt"
              value={passedStudents}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {editing && (
        <Alert
          type="info"
          showIcon
          message="Đang chỉnh sửa điểm. Nhấn Lưu để cập nhật hoặc Hủy để bỏ thay đổi."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={`Bảng điểm - ${selectedClass?.ten_lop}`}
        extra={
          <Space wrap>
            {!editing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                Nhập / Sửa điểm
              </Button>
            ) : (
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleCancel}
                >
                  Hủy
                </Button>

                <Popconfirm
                  title="Xác nhận lưu bảng điểm?"
                  description="Điểm đã nhập sẽ được lưu vào dữ liệu mẫu."
                  onConfirm={handleSave}
                  okText="Lưu"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                  >
                    Lưu điểm
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={gradeRows}
          rowKey="ma_xep_lop"
          pagination={false}
          scroll={{ x: 850 }}
        />

        <Typography.Text type="secondary">
          Thang điểm: 0–10. Ngưỡng đạt 5.0 và các mức xếp loại
          hiện là quy ước hiển thị mẫu, có thể điều chỉnh theo
          quy định của trung tâm.
        </Typography.Text>
      </Card>
    </div>
  );
}
