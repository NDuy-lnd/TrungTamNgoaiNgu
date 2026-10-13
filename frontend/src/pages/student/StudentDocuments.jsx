
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Card,
  Typography,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  message,
} from "antd";

import {
  FileTextOutlined,
  SearchOutlined,
  LinkOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import studentDocumentService from "../../services/studentDocumentService";


function formatDate(value) {
  if (!value) return "—";

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed.format("DD/MM/YYYY")
    : "—";
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
    return "Bạn không có quyền xem tài liệu.";
  }

  if (error?.response?.status === 404) {
    return "Không tìm thấy hồ sơ học viên.";
  }

  return "Không thể tải danh sách tài liệu.";
}


export default function StudentDocuments() {
  const [messageApi, contextHolder] = message.useMessage();

  const [keyword, setKeyword] = useState("");
  const [classId, setClassId] = useState("all");

  const [classes, setClasses] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);


  // 1. Lấy dữ liệu tài liệu từ MySQL
  const fetchDocuments = useCallback(async () => {
    setLoading(true);

    try {
      const data =
        await studentDocumentService.getDocuments();

      const newClasses = data.classes || [];
      const newDocuments = data.documents || [];

      setClasses(newClasses);
      setDocuments(newDocuments);

      // Nếu lớp đang chọn không còn tồn tại
      // thì trở về bộ lọc tất cả lớp.
      setClassId((previous) => {
        if (previous === "all") {
          return previous;
        }

        const exists = newClasses.some(
          (item) => item.ma_lop === previous
        );

        return exists ? previous : "all";
      });
    } catch (error) {
      messageApi.error(getErrorMessage(error));

      setClasses([]);
      setDocuments([]);
      setClassId("all");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);


  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);


  // 2. Tìm kiếm và lọc theo lớp
  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesClass =
        classId === "all" ||
        item.ma_lop === classId;

      const matchesKeyword =
        `${item.ten_tai_lieu} ${item.mo_ta || ""}`
          .toLowerCase()
          .includes(search);

      return matchesClass && matchesKeyword;
    });
  }, [documents, keyword, classId]);


  // 3. Mở tài liệu
  const openDocument = (value) => {
    try {
      const url = new URL(value);

      if (
        !["http:", "https:"].includes(
          url.protocol
        )
      ) {
        throw new Error("Invalid protocol");
      }

      // Không cho phép URL chứa thông tin
      // đăng nhập dạng user:password@host.
      if (url.username || url.password) {
        throw new Error("Invalid URL");
      }

      window.open(
        url.href,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      messageApi.error(
        "Đường dẫn tài liệu không hợp lệ"
      );
    }
  };


  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "ten_tai_lieu",

      render: (name) => (
        <Space>
          <FileTextOutlined
            style={{ color: "#1677ff" }}
          />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: "Lớp học",
      dataIndex: "ten_lop",

      render: (name) => (
        <Tag color="blue">
          {name || "—"}
        </Tag>
      ),
    },
    {
      title: "Ngày đăng",
      dataIndex: "ngay_dang",

      render: (value) => formatDate(value),
    },
    {
      title: "Mô tả",
      dataIndex: "mo_ta",

      ellipsis: true,

      render: (value) => value || "—",
    },
    {
      title: "Thao tác",

      render: (_, record) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          onClick={() =>
            openDocument(
              record.duong_dan_file
            )
          }
        >
          Mở tài liệu
        </Button>
      ),
    },
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
            marginBottom: 20,
          }}
        >
          <Input
            placeholder="Tìm kiếm tài liệu..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            allowClear
            style={{ width: 270 }}
          />

          <Space wrap>
            <Select
              value={classId}
              onChange={setClassId}
              style={{ width: 230 }}
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

            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchDocuments}
            >
              Làm mới
            </Button>
          </Space>
        </Space>

        <Table
          rowKey="ma_tai_lieu"
          dataSource={filtered}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: "Không tìm thấy tài liệu",
          }}
        />
      </Card>
    </div>
  );
}
