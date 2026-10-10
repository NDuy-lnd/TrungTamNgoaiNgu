
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Space,
  Button
} from "antd";

import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  BookOutlined,
  LogoutOutlined
} from "@ant-design/icons";

import {
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: "/teacher",
    icon: <DashboardOutlined />,
    label: "Tổng quan"
  },
  {
    key: "/teacher/lop-hoc",
    icon: <TeamOutlined />,
    label: "Lớp của tôi"
  },
  {
    key: "/teacher/lich-day",
    icon: <CalendarOutlined />,
    label: "Lịch giảng dạy"
  },
  {
    key: "/teacher/diem-danh",
    icon: <CheckSquareOutlined />,
    label: "Điểm danh"
  },
  {
    key: "/teacher/diem",
    icon: <FileTextOutlined />,
    label: "Quản lý điểm"
  },
  {
    key: "/teacher/tai-lieu",
    icon: <BookOutlined />,
    label: "Tài liệu"
  }
];

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
            <small>Teacher Portal</small>
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
            border: "none"
          }}
        />
      </Sider>

      <Layout>
        <Header
          className="app-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16
          }}
        >
          <Typography.Text strong>
            Cổng thông tin Giáo viên
          </Typography.Text>

          <Space size="large">
            <Space>
              <Avatar style={{ background: "#1677FF" }}>
                {user?.name?.charAt(0) || "G"}
              </Avatar>
              <span>{user?.name || "Giáo viên"}</span>
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

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
