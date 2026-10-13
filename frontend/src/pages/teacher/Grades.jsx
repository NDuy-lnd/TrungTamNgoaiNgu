
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card, Row, Col, Statistic, Typography,
  Select, Table, InputNumber, Button, Space,
  Tag, Alert, message, Popconfirm, Empty
} from "antd";

import {
  BookOutlined, CheckCircleOutlined,
  EditOutlined, SaveOutlined, ReloadOutlined
} from "@ant-design/icons";

import teacherGradeService from "../../services/teacherGradeService";

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

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("; ");
  }

  if (error?.response?.status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (error?.response?.status === 403) {
    return "Bạn không có quyền sửa điểm lớp này.";
  }

  return "Không thể kết nối đến máy chủ.";
}

export default function Grades() {
  const [messageApi, contextHolder] = message.useMessage();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [students, setStudents] = useState([]);
  const [savedGrades, setSavedGrades] = useState({});
  const [draftGrades, setDraftGrades] = useState({});

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(
    (item) => item.ma_lop === selectedClassId
  );

  // 1. Lấy danh sách lớp được phân công
  const fetchClasses = useCallback(async () => {
    try {
      const data = await teacherGradeService.getClasses();

      setClasses(data || []);

      setSelectedClassId((previous) => {
        if (data.some((item) => item.ma_lop === previous)) {
          return previous;
        }

        return data[0]?.ma_lop ?? null;
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    }
  }, [messageApi]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // 2. Lấy điểm từ MySQL
  const fetchGrades = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setSavedGrades({});
      setDraftGrades({});
      setEditing(false);
      return;
    }

    setLoading(true);

    try {
      const data = await teacherGradeService.getGrades(
        selectedClassId
      );

      const grades = {};

      (data.items || []).forEach((student) => {
        grades[student.ma_xep_lop] = student.diem_tong_ket;
      });

      setStudents(data.items || []);
      setSavedGrades(grades);
      setDraftGrades({});
      setEditing(false);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
      setStudents([]);
      setSavedGrades({});
      setDraftGrades({});
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, messageApi]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // 3. Ghép điểm đã lưu với bản nháp
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
        diem_tong_ket: score,
      };
    });
  }, [students, savedGrades, draftGrades]);

  // 4. Thống kê
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

  // 5. Nhập điểm
  const handleScoreChange = (studentId, value) => {
    setDraftGrades((previous) => ({
      ...previous,
      [studentId]: value,
    }));
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setDraftGrades({});
    setEditing(false);
  };

  // 6. Lưu các điểm được chỉnh sửa
  const handleSave = async () => {
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

    const records = Object.entries(draftGrades).map(
      ([key, value]) => ({
        ma_xep_lop: Number(key),
        diem_tong_ket: value,
      })
    );

    if (!records.length) {
      setEditing(false);
      return;
    }

    setSaving(true);

    try {
      await teacherGradeService.saveGrades(
        selectedClassId,
        records
      );

      messageApi.success("Lưu điểm thành công!");
      await fetchGrades();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
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
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã học viên",
      dataIndex: "ma_hoc_vien",
      width: 130,
    },
    {
      title: "Họ và tên",
      dataIndex: "ho_ten",
      render: (name) => <strong>{name}</strong>,
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
              handleScoreChange(record.ma_xep_lop, value)
            }
            placeholder="Nhập điểm"
            style={{ width: 125 }}
          />
        ) : record.diem_tong_ket !== null ? (
          <Typography.Text strong>
            {Number(record.diem_tong_ket).toFixed(2)}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">
            Chưa nhập
          </Typography.Text>
        ),
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
      },
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
      },
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Quản lý điểm
        </Typography.Title>

        <Typography.Text type="secondary">
          Nhập và cập nhật điểm tổng kết cho học viên
        </Typography.Text>
      </div>

      {/* Chọn lớp và khóa học */}
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
                placeholder="Chọn lớp học"
                options={classes.map((item) => ({
                  value: item.ma_lop,
                  label: item.ten_lop,
                }))}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>
              Khóa học
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              {selectedClass ? (
                <Tag color="blue">
                  {selectedClass.khoa_hoc}
                </Tag>
              ) : (
                <Tag>Chưa chọn lớp</Tag>
              )}
            </div>
          </div>
        </Space>
      </Card>

      {/* Thống kê */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 20 }}
      >
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng học viên"
              value={students.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Đã có điểm"
              value={gradedStudents.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Điểm trung bình"
              value={averageScore ?? "—"}
              precision={
                averageScore === null ? undefined : 2
              }
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Học viên đạt"
              value={passedStudents}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Trạng thái chỉnh sửa */}
      {editing && (
        <Alert
          type="info"
          showIcon
          message="Đang chỉnh sửa điểm. Nhấn Lưu để cập nhật hoặc Hủy để bỏ thay đổi."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Bảng điểm */}
      <Card
        title={
          `Bảng điểm - ${
            selectedClass?.ten_lop || "Chưa chọn lớp"
          }`
        }
        extra={
          <Space wrap>
            {!editing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
                disabled={!students.length || loading}
              >
                Nhập / Sửa điểm
              </Button>
            ) : (
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Hủy
                </Button>

                <Popconfirm
                  title="Xác nhận lưu bảng điểm?"
                  description="Các điểm được chỉnh sửa sẽ lưu vào MySQL."
                  onConfirm={handleSave}
                  okText="Lưu"
                  cancelText="Hủy"
                  disabled={saving}
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Lưu điểm
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      >
        {classes.length === 0 && !loading ? (
          <Empty description="Chưa có lớp được phân công" />
        ) : (
          <Table
            columns={columns}
            dataSource={gradeRows}
            rowKey="ma_xep_lop"
            loading={loading}
            pagination={false}
            scroll={{ x: 850 }}
          />
        )}

        <Typography.Text type="secondary">
          Thang điểm: 0–10. Ngưỡng đạt 5.0 và các mức xếp loại
          hiện là quy ước hiển thị, có thể điều chỉnh theo
          quy định của trung tâm.
        </Typography.Text>
      </Card>
    </div>
  );
}
