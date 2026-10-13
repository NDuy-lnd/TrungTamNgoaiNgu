
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Space,
  Button,
  Modal,
} from "antd";

import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "Tổng quan",
  },
  {
    key: "/hoc-vien",
    icon: <TeamOutlined />,
    label: "Học viên",
  },
  {
    key: "/giao-vien",
    icon: <UserOutlined />,
    label: "Giáo viên",
  },
  {
    key: "/khoa-hoc",
    icon: <BookOutlined />,
    label: "Khóa học",
  },
  {
    key: "/lop-hoc",
    icon: <BankOutlined />,
    label: "Lớp học",
  },
  {
    key: "/lich-hoc",
    icon: <CalendarOutlined />,
    label: "Lịch học",
  },
  {
    key: "/thong-ke",
    icon: <BarChartOutlined />,
    label: "Thống kê",
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  const [modal, contextHolder] = Modal.useModal();

  // Hiển thị xác nhận trước khi đăng xuất
  const handleLogout = () => {
    modal.confirm({
      title: "Xác nhận đăng xuất",
      icon: <ExclamationCircleOutlined />,

      content:
        "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?",

      okText: "Đăng xuất",
      okType: "danger",

      cancelText: "Hủy",

      centered: true,

      onOk: () => {
        logout();
        navigate("/login", { replace: true });
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}

      {/* SIDEBAR */}
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: "#0F172A" }}
      >
        <div className="sidebar-logo">
          <div className="logo-icon">E</div>

          <div>
            <strong>EduCenter</strong>
            <small>Management System</small>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: "#0F172A",
            border: "none",
          }}
        />
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        {/* HEADER */}
        <Header
          className="app-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Typography.Text strong>
            Hệ thống quản lý trung tâm ngoại ngữ
          </Typography.Text>

          <Space size="large">

            <Space>
              <Avatar
                style={{ background: "#1677FF" }}
              >
                {user?.name?.charAt(0) || "A"}
              </Avatar>

              <span>
                {user?.name || "Quản trị viên"}
              </span>
            </Space>

            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        {/* NỘI DUNG TRANG */}
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
