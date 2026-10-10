
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Layout, Menu, Button, Avatar, Typography, Space,
  Drawer, Grid
} from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { studentProfile } from "../data/studentDemoData";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const menuItems = [
  { key: "/student", icon: <DashboardOutlined />, label: "Tổng quan" },
  { key: "/student/lop-hoc", icon: <BookOutlined />, label: "Lớp học của tôi" },
  { key: "/student/lich-hoc", icon: <CalendarOutlined />, label: "Lịch học" },
  { key: "/student/diem-danh", icon: <CheckSquareOutlined />, label: "Điểm danh" },
  { key: "/student/ket-qua", icon: <TrophyOutlined />, label: "Kết quả học tập" },
  { key: "/student/tai-lieu", icon: <FileTextOutlined />, label: "Tài liệu học tập" },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <>
      <div style={{
        height: 76,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        color: "white",
        fontWeight: 700,
        fontSize: 18
      }}>
        <BookOutlined style={{ marginRight: 12, fontSize: 24 }} />
        Trung tâm ngoại ngữ
      </div>

      <div style={{
        color: "#94a3b8",
        padding: "0 22px 18px",
        fontSize: 12
      }}>
        CỔNG THÔNG TIN HỌC VIÊN
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => {
          navigate(key);
          setDrawerOpen(false);
        }}
        style={{ background: "transparent", borderInlineEnd: 0 }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {screens.md ? (
        <Sider width={255} style={{ background: "#0f172a" }}>
          {sidebar}
        </Sider>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={270}
          styles={{
            body: { padding: 0, background: "#0f172a" },
            header: { background: "#0f172a", color: "white" }
          }}
        >
          {sidebar}
        </Drawer>
      )}

      <Layout>
        <Header style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e8edf3"
        }}>
          <Space>
            {!screens.md && (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            )}
            <Typography.Text strong>
              Hệ thống quản lý đào tạo
            </Typography.Text>
          </Space>

          <Space size="middle">
            <Avatar icon={<UserOutlined />} style={{ background: "#1677ff" }} />
            {screens.sm && (
              <Typography.Text>
                {studentProfile.ho_ten}
              </Typography.Text>
            )}
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              {screens.sm ? "Đăng xuất" : ""}
            </Button>
          </Space>
        </Header>

        <Content style={{
          margin: 24,
          padding: 0,
          minHeight: 300,
          background: "#f5f7fb"
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
