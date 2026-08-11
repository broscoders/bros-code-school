import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Academics from "./pages/Academics";
import Fees from "./pages/Fees";
import Announcements from "./pages/Announcements";
import Attendance from "./pages/Attendance";
import Homework from "./pages/Homework";
import Assignments from "./pages/Assignments";
import Exams from "./pages/Exams";
import Admissions from "./pages/Admissions";
import Academy from "./pages/Academy";
import Operations from "./pages/Operations";
import AuditLogs from "./pages/AuditLogs";
import DashboardLayout from "./layouts/DashboardLayout";
import ParentLayout from "./layouts/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentHomework from "./pages/parent/ParentHomework";
import ParentResults from "./pages/parent/ParentResults";
import ParentFees from "./pages/parent/ParentFees";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentHomework from "./pages/student/StudentHomework";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentResults from "./pages/student/StudentResults";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { useAuthStore } from "./store/authStore";

const ADMIN_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF", "ACADEMIC_COORDINATOR", "ACCOUNTANT", "RECEPTIONIST", "LIBRARIAN", "TRANSPORT_MANAGER"];
const TEACHER_ROLES = ["TEACHER", "ACADEMY_TEACHER"];

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "PARENT") return <Navigate to="/parent/dashboard" />;
  if (user?.role === "STUDENT") return <Navigate to="/student/dashboard" />;
  if (TEACHER_ROLES.includes(user?.role || "")) return <Navigate to="/teacher/dashboard" />;
  if (ADMIN_ROLES.includes(user?.role || "")) return <Navigate to="/dashboard" />;
  return <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RoleProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardLayout /></RoleProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["PARENT"]}><ParentLayout /></RoleProtectedRoute>}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/attendance" element={<ParentAttendance />} />
          <Route path="/parent/homework" element={<ParentHomework />} />
          <Route path="/parent/results" element={<ParentResults />} />
          <Route path="/parent/fees" element={<ParentFees />} />
          <Route path="/parent/announcements" element={<ParentAnnouncements />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["STUDENT"]}><StudentLayout /></RoleProtectedRoute>}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherLayout /></RoleProtectedRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/homework" element={<TeacherHomework />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/marks" element={<TeacherMarks />} />
          <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
