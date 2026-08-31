import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ChangePasswordRequired from "./pages/auth/ChangePasswordRequired";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/school/Dashboard";
import Students from "./pages/school/Students";
import Teachers from "./pages/school/Teachers";
import Parents from "./pages/school/Parents";
import Academics from "./pages/school/Academics";
import Timetable from "./pages/school/Timetable";
import Documents from "./pages/school/Documents";
import Library from "./pages/school/Library";
import Transport from "./pages/school/Transport";
import Automation from "./pages/school/Automation";
import WebsiteCMS from "./pages/school/WebsiteCMS";
import PublicSite from "./pages/public/PublicSite";
import Fees from "./pages/school/Fees";
import Announcements from "./pages/school/Announcements";
import Attendance from "./pages/school/Attendance";
import Homework from "./pages/school/Homework";
import Assignments from "./pages/school/Assignments";
import Exams from "./pages/school/Exams";
import Admissions from "./pages/school/Admissions";
import Academy from "./pages/school/Academy";
import Operations from "./pages/school/Operations";
import AuditLogs from "./pages/school/AuditLogs";
import LeaveRequests from "./pages/school/LeaveRequests";
import Surveys from "./pages/school/Surveys";
import Settings from "./pages/school/Settings";
import CRM from "./pages/school/CRM";
import Certificates from "./pages/school/Certificates";
import Discipline from "./pages/school/Discipline";
import IDCards from "./pages/school/IDCards";
import CalendarPage from "./pages/school/CalendarPage";
import ReportCards from "./pages/school/ReportCards";
import Reports from "./pages/school/Reports";
import Accounting from "./pages/school/Accounting";
import HRManagement from "./pages/school/HRManagement";
import Payroll from "./pages/school/Payroll";
import Hostel from "./pages/school/Hostel";
import InventoryAssets from "./pages/school/InventoryAssets";
import Maintenance from "./pages/school/Maintenance";
import Visitors from "./pages/school/Visitors";
import Health from "./pages/school/Health";
import RolesPermissions from "./pages/school/RolesPermissions";
import DashboardLayout from "./layouts/DashboardLayout";
import ParentLayout from "./layouts/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentHomework from "./pages/parent/ParentHomework";
import ParentResults from "./pages/parent/ParentResults";
import ParentFees from "./pages/parent/ParentFees";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentPTM from "./pages/parent/ParentPTM";
import ParentLeave from "./pages/parent/ParentLeave";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentQuizzes from "./pages/student/StudentQuizzes";
import StudentCourses from "./pages/student/StudentCourses";
import StudentAcademy from "./pages/student/StudentAcademy";
import StudentHomework from "./pages/student/StudentHomework";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentResults from "./pages/student/StudentResults";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentStore from "./pages/student/StudentStore";
import StudentCertificates from "./pages/student/StudentCertificates";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherQuizzes from "./pages/teacher/TeacherQuizzes";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherAcademy from "./pages/teacher/TeacherAcademy";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherMessages from "./pages/teacher/TeacherMessages";
import TeacherPTM from "./pages/teacher/TeacherPTM";
import TeacherStudyMaterial from "./pages/teacher/TeacherStudyMaterial";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import PlatformProtectedRoute from "./components/PlatformProtectedRoute";
import PlatformLayout from "./layouts/PlatformLayout";
import PlatformLogin from "./pages/platform/PlatformLogin";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformOrganizations from "./pages/platform/PlatformOrganizations";
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
        <Route path="/site/:slug" element={<PublicSite />} />
        <Route path="/platform/login" element={<PlatformLogin />} />

        <Route element={<PlatformProtectedRoute><PlatformLayout /></PlatformProtectedRoute>}>
          <Route path="/platform/dashboard" element={<PlatformDashboard />} />
          <Route path="/platform/organizations" element={<PlatformOrganizations />} />
        </Route>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password-required" element={<ChangePasswordRequired />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RoleProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardLayout /></RoleProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/documents" element={<Documents />} />
        <Route path="/library" element={<Library />} />
        <Route path="/transport" element={<Transport />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/website-cms" element={<WebsiteCMS />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/homework" element={<Homework />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/id-cards" element={<IDCards />} />
          <Route path="/discipline" element={<Discipline />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/report-cards" element={<ReportCards />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/hr" element={<HRManagement />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/hostel" element={<Hostel />} />
          <Route path="/inventory-assets" element={<InventoryAssets />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/health" element={<Health />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/roles-permissions" element={<RolesPermissions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/leave-requests" element={<LeaveRequests />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["PARENT"]}><ParentLayout /></RoleProtectedRoute>}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/attendance" element={<ParentAttendance />} />
          <Route path="/parent/homework" element={<ParentHomework />} />
          <Route path="/parent/results" element={<ParentResults />} />
          <Route path="/parent/fees" element={<ParentFees />} />
          <Route path="/parent/messages" element={<ParentMessages />} />
          <Route path="/parent/ptm" element={<ParentPTM />} />
          <Route path="/parent/leave" element={<ParentLeave />} />
          <Route path="/parent/announcements" element={<ParentAnnouncements />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["STUDENT"]}><StudentLayout /></RoleProtectedRoute>}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/quizzes" element={<StudentQuizzes />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/academy" element={<StudentAcademy />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/store" element={<StudentStore />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherLayout /></RoleProtectedRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/timetable" element={<TeacherTimetable />} />
          <Route path="/teacher/quizzes" element={<TeacherQuizzes />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/academy" element={<TeacherAcademy />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/homework" element={<TeacherHomework />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/marks" element={<TeacherMarks />} />
          <Route path="/teacher/study-material" element={<TeacherStudyMaterial />} />
          <Route path="/teacher/messages" element={<TeacherMessages />} />
          <Route path="/teacher/ptm" element={<TeacherPTM />} />
          <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;










