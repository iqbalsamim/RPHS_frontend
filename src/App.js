import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";

// 🔥 NEW PAGES
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import Exams from "./pages/Exams";
import Marks from "./pages/Marks";
import Marksheet from "./pages/Marksheet";
// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// 🔐 Logout Component
function Logout() {
  localStorage.removeItem("user");
  return <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔓 Public */}
        <Route path="/" element={<Login />} />

        {/* 🔐 Protected Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* 📊 Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* 👨‍🎓 Students */}
          <Route
            path="students"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Students />
              </ProtectedRoute>
            }
          />

          <Route path="add-student" element={<AddStudent />} />
          <Route path="edit-student/:id" element={<EditStudent />} />

          {/* 📅 Attendance */}
          <Route
            path="attendance"
            element={
              <ProtectedRoute roles={["admin", "teacher"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* 💰 Fees */}
          <Route
            path="fees"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Fees />
              </ProtectedRoute>
            }
          />

          {/* 👨‍🏫 Teachers 🔥 */}
          <Route
            path="teachers"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Teachers />
              </ProtectedRoute>
            }
          />

          {/* 📚 Subjects 🔥 */}
          <Route
            path="subjects"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Subjects />
              </ProtectedRoute>
            }
          />

          {/* 📊 Marks 🔥 */}
          <Route
            path="marks"
            element={
              <ProtectedRoute roles={["admin", "teacher"]}>
                <Marks />
              </ProtectedRoute>
            }
          />
          <Route path="timetable" element={<Timetable />} />
          <Route path="exams" element={<Exams />} />
          <Route path="marksheet" element={<Marksheet />} />

          {/* 🚪 Logout */}
          <Route path="logout" element={<Logout />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;