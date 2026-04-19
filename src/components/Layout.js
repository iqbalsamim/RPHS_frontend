import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CalendarCheck,
  LogOut,
  Menu,
  BookOpen,
  GraduationCap,
  BarChart3,
  FileText,
  ClipboardList
} from "lucide-react";
import { motion } from "framer-motion";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // ================= MENU ITEMS =================
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

    { path: "/students", label: "Students", icon: Users },
    { path: "/teachers", label: "Teachers", icon: GraduationCap },

    { path: "/subjects", label: "Subjects", icon: BookOpen },
    { path: "/marks", label: "Marks", icon: BarChart3 },

    { path: "/exams", label: "Exams", icon: FileText },
    { path: "/timetable", label: "Timetable", icon: ClipboardList },

    { path: "/fees", label: "Fees", icon: DollarSign },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck },

    { path: "/logout", label: "Logout", icon: LogOut }
  ];

  // ================= BREADCRUMB =================
  const getBreadcrumb = () => {
    const path = location.pathname.split("/").filter(Boolean);

    return path.map((p, i) => (
      <span key={i} className="me-2 fw-semibold" style={{ color: "#94a3b8" }}>
        {p.toUpperCase()}
        {i < path.length - 1 && " / "}
      </span>
    ));
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "white" }}>

      {/* ================= SIDEBAR ================= */}
      <motion.div
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "linear-gradient(180deg, #0f172a, #020617)",
          color: "#fff",
          boxShadow: "0 0 25px rgba(0,0,0,0.5)",
          overflow: "hidden"
        }}
        className="p-3"
      >

        {/* LOGO */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!collapsed && (
            <motion.h5
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fw-bold text-white"
            >
              🎓 RPHS ERP
            </motion.h5>
          )}

          <Menu
            style={{ cursor: "pointer", color: "#fff" }}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* MENU */}
        <div className="nav flex-column gap-2">

          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink key={index} to={item.path} style={{ textDecoration: "none" }}>
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="d-flex align-items-center p-2 rounded position-relative"
                    style={{
                      background: isActive
                        ? "linear-gradient(90deg, #0ea5e9, #6366f1)"
                        : "transparent",
                      borderRadius: "10px",
                      cursor: "pointer"
                    }}
                  >

                    {/* ACTIVE BAR */}
                    {isActive && (
                      <motion.div
                        layoutId="active"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "4px",
                          background: "#38bdf8",
                          borderRadius: "0 4px 4px 0"
                        }}
                      />
                    )}

                    <Icon size={20} color="#e2e8f0" />

                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ms-3 fw-semibold"
                        style={{ color: "#f1f5f9" }}
                      >
                        {item.label}
                      </motion.span>
                    )}

                  </motion.div>
                )}
              </NavLink>
            );
          })}

        </div>
      </motion.div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-grow-1">

        {/* TOPBAR */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3"
          style={{
            background: "linear-gradient(90deg, #020617, #0f172a)",
            borderBottom: "1px solid #1e293b"
          }}
        >
          <h5 className="mb-0 text-white fw-bold">
            School ERP System
          </h5>

          <div className="text-white fw-semibold">
            {JSON.parse(localStorage.getItem("user"))?.name || "User"}
          </div>
        </div>

        {/* BREADCRUMB */}
        <div className="px-4 pt-3">
          {getBreadcrumb()}
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default Layout;