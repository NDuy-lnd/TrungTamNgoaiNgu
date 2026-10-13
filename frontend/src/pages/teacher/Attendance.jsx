
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card, Row, Col, Statistic, Typography, Select,
  DatePicker, Table, Radio, Input, Button,
  Space, Tag, Alert, message, Modal, Empty
} from "antd";

import {
  TeamOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SaveOutlined,
  ReloadOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";
import teacherAttendanceService from "../../services/teacherAttendanceService";

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
    return "Bạn không có quyền điểm danh lớp này.";
  }

  return "Không thể kết nối đến máy chủ.";
}

export default function Attendance() {
  const [messageApi, contextHolder] = message.useMessage();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [students, setStudents] = useState([]);
  const [savedRecords, setSavedRecords] = useState({});
  const [draftAttendance, setDraftAttendance] = useState({});

  const [dirty, setDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(
    (item) => item.ma_lop === selectedClassId
  );

  const dateString = selectedDate.format("YYYY-MM-DD");

  // Lấy danh sách lớp của giáo viên
  const fetchClasses = useCallback(async () => {
    try {
      const data = await teacherAttendanceService.getClasses();
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

  // Lấy dữ liệu điểm danh theo lớp và ngày
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setSavedRecords({});
      setDraftAttendance({});
      setIsSaved(false);
      setDirty(false);
      return;
    }

    setLoading(true);

    try {
      const data = await teacherAttendanceService.getAttendance(
        selectedClassId,
        dateString
      );

      const records = {};

      (data.items || []).forEach((student) => {
        records[student.ma_xep_lop] = {
          trang_thai: student.trang_thai,
          ghi_chu: student.ghi_chu || "",
        };
      });

      setStudents(data.items || []);
      setSavedRecords(records);
      setDraftAttendance({});
      setIsSaved(data.is_saved || false);
      setDirty(false);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
      setStudents([]);
      setSavedRecords({});
      setDraftAttendance({});
      setIsSaved(false);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, dateString, messageApi]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Dữ liệu hiển thị: bản nháp nếu có chỉnh sửa,
  // nếu không thì dùng dữ liệu đã lấy từ MySQL.
  const currentRecords = dirty
    ? draftAttendance
    : savedRecords;

  const attendanceRows = useMemo(() => {
    return students.map((student) => ({
      ...student,
      trang_thai:
        currentRecords[student.ma_xep_lop]?.trang_thai || null,
      ghi_chu:
        currentRecords[student.ma_xep_lop]?.ghi_chu || "",
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

  // Thay đổi trạng thái hoặc ghi chú
  const updateAttendance = (studentId, field, value) => {
    const updated = {
      ...currentRecords,
      [studentId]: {
        ...(currentRecords[studentId] || {}),
        [field]: value,
      },
    };

    setDraftAttendance(updated);
    setDirty(true);
  };

  // Xác nhận trước khi bỏ thay đổi chưa lưu
  const confirmDiscard = (callback) => {
    if (!dirty) {
      callback();
      return;
    }

    Modal.confirm({
      title: "Bạn có thay đổi chưa lưu",
      content: "Chuyển lớp hoặc ngày sẽ hủy các thay đổi này.",
      okText: "Tiếp tục",
      cancelText: "Ở lại",
      onOk: callback,
    });
  };

  const handleClassChange = (value) => {
    confirmDiscard(() => {
      setSelectedClassId(value);
    });
  };

  const handleDateChange = (date) => {
    if (!date) return;

    confirmDiscard(() => {
      setSelectedDate(date);
    });
  };

  // Đánh dấu toàn bộ học viên có mặt
  const markAllPresent = () => {
    if (!students.length) return;

    const updated = {};

    students.forEach((student) => {
      updated[student.ma_xep_lop] = {
        trang_thai: "Có mặt",
        ghi_chu:
          currentRecords[student.ma_xep_lop]?.ghi_chu || "",
      };
    });

    setDraftAttendance(updated);
    setDirty(true);
  };

  // Hoàn tác, quay lại dữ liệu đã lưu trên MySQL
  const resetDraft = () => {
    setDraftAttendance({});
    setDirty(false);
    messageApi.info("Đã khôi phục dữ liệu đã lưu");
  };

  // Gửi điểm danh lên Backend
  const handleSave = async () => {
    if (!selectedClassId || !students.length) return;

    if (unmarkedCount > 0) {
      messageApi.warning(
        `Còn ${unmarkedCount} học viên chưa được điểm danh`
      );
      return;
    }

    const records = attendanceRows.map((item) => ({
      ma_xep_lop: item.ma_xep_lop,
      trang_thai: item.trang_thai,
      ghi_chu: item.ghi_chu.trim() || null,
    }));

    setSaving(true);

    try {
      await teacherAttendanceService.saveAttendance(
        selectedClassId,
        dateString,
        records
      );

      messageApi.success("Lưu điểm danh thành công!");
      await fetchAttendance();
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
      ),
    },
    {
      title: "Ghi chú",
      render: (_, record) => (
        <Input
          placeholder="Nhập ghi chú..."
          maxLength={255}
          value={record.ghi_chu}
          onChange={(event) =>
            updateAttendance(
              record.ma_xep_lop,
              "ghi_chu",
              event.target.value
            )
          }
        />
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      {/* Tiêu đề */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>
          Điểm danh học viên
        </Typography.Title>

        <Typography.Text type="secondary">
          Quản lý tình trạng tham gia học tập theo lớp và ngày học
        </Typography.Text>
      </div>

      {/* Chọn lớp, ngày, trạng thái lưu */}
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
              Ngày học
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                allowClear={false}
                disabledDate={(date) =>
                  date && date.isAfter(dayjs(), "day")
                }
              />
            </div>
          </div>

          <div>
            <Typography.Text strong>
              Trạng thái lưu
            </Typography.Text>

            <div style={{ marginTop: 8 }}>
              {dirty ? (
                <Tag color="orange">
                  Chưa lưu thay đổi
                </Tag>
              ) : isSaved ? (
                <Tag color="green">
                  Đã lưu
                </Tag>
              ) : (
                <Tag>Chưa điểm danh</Tag>
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
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Có mặt"
              value={presentCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Vắng mặt"
              value={absentCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card loading={loading}>
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

      {/* Danh sách học viên */}
      <Card
        title={
          `Danh sách học viên - ${
            selectedClass?.ten_lop || "Chưa chọn lớp"
          }`
        }
        extra={
          <Space wrap>
            <Button
              onClick={markAllPresent}
              disabled={!students.length || loading}
            >
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
              loading={saving}
              disabled={
                !students.length ||
                loading ||
                !dirty
              }
            >
              Lưu điểm danh
            </Button>
          </Space>
        }
      >
        {classes.length === 0 && !loading ? (
          <Empty description="Chưa có lớp được phân công" />
        ) : (
          <Table
            columns={columns}
            dataSource={attendanceRows}
            rowKey="ma_xep_lop"
            loading={loading}
            pagination={false}
            scroll={{ x: 850 }}
          />
        )}

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
