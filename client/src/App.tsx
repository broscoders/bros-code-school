import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import PlatformProtectedRoute from "./components/PlatformProtectedRoute";
import { useAuthStore } from "./store/authStore";

// Every page is loaded on demand (its own small file) instead of shipping
// the whole app - admin, teacher, parent, student, platform - in one 1.6 MB
// bundle that had to download before the login page could even appear.
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ChangePasswordRequired = lazy(() => import("./pages/auth/ChangePasswordRequired"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AcceptInvite = lazy(() => import("./pages/auth/AcceptInvite"));
const Onboarding = lazy(() => import("./pages/onboarding/Onboarding"));
const Dashboard = lazy(() => import("./pages/school/Dashboard"));
const Students = lazy(() => import("./pages/school/Students"));
const Teachers = lazy(() => import("./pages/school/Teachers"));
const Parents = lazy(() => import("./pages/school/Parents"));
const Academics = lazy(() => import("./pages/school/Academics"));
const Timetable = lazy(() => import("./pages/school/Timetable"));
const Documents = lazy(() => import("./pages/school/Documents"));
const Library = lazy(() => import("./pages/school/Library"));
const Transport = lazy(() => import("./pages/school/Transport"));
const Automation = lazy(() => import("./pages/school/Automation"));
const WebsiteCMS = lazy(() => import("./pages/school/WebsiteCMS"));
const PublicSite = lazy(() => import("./pages/public/PublicSite"));
const Fees = lazy(() => import("./pages/school/Fees"));
const Announcements = lazy(() => import("./pages/school/Announcements"));
const Attendance = lazy(() => import("./pages/school/Attendance"));
const Homework = lazy(() => import("./pages/school/Homework"));
const Assignments = lazy(() => import("./pages/school/Assignments"));
const Exams = lazy(() => import("./pages/school/Exams"));
const Admissions = lazy(() => import("./pages/school/Admissions"));
const Academy = lazy(() => import("./pages/school/Academy"));
const Operations = lazy(() => import("./pages/school/Operations"));
const AuditLogs = lazy(() => import("./pages/school/AuditLogs"));
const LeaveRequests = lazy(() => import("./pages/school/LeaveRequests"));
const Surveys = lazy(() => import("./pages/school/Surveys"));
const Settings = lazy(() => import("./pages/school/Settings"));
const CRM = lazy(() => import("./pages/school/CRM"));
const Certificates = lazy(() => import("./pages/school/Certificates"));
const Discipline = lazy(() => import("./pages/school/Discipline"));
const Achievements = lazy(() => import("./pages/school/Achievements"));
const IDCards = lazy(() => import("./pages/school/IDCards"));
const CalendarPage = lazy(() => import("./pages/school/CalendarPage"));
const ReportCards = lazy(() => import("./pages/school/ReportCards"));
const Reports = lazy(() => import("./pages/school/Reports"));
const Accounting = lazy(() => import("./pages/school/Accounting"));
const HRManagement = lazy(() => import("./pages/school/HRManagement"));
const StaffAttendance = lazy(() => import("./pages/school/StaffAttendance"));
const Payroll = lazy(() => import("./pages/school/Payroll"));
const Hostel = lazy(() => import("./pages/school/Hostel"));
const InventoryAssets = lazy(() => import("./pages/school/InventoryAssets"));
const Maintenance = lazy(() => import("./pages/school/Maintenance"));
const Visitors = lazy(() => import("./pages/school/Visitors"));
const Health = lazy(() => import("./pages/school/Health"));
const RolesPermissions = lazy(() => import("./pages/school/RolesPermissions"));
const Invitations = lazy(() => import("./pages/school/Invitations"));
const LMSOverview = lazy(() => import("./pages/school/LMSOverview"));
const OnlineExamsOverview = lazy(() => import("./pages/school/OnlineExamsOverview"));
const CommunicationLog = lazy(() => import("./pages/school/CommunicationLog"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const ParentLayout = lazy(() => import("./layouts/ParentLayout"));
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentAttendance = lazy(() => import("./pages/parent/ParentAttendance"));
const ParentHomework = lazy(() => import("./pages/parent/ParentHomework"));
const ParentResults = lazy(() => import("./pages/parent/ParentResults"));
const ParentFees = lazy(() => import("./pages/parent/ParentFees"));
const ParentAnnouncements = lazy(() => import("./pages/parent/ParentAnnouncements"));
const ParentHealth = lazy(() => import("./pages/parent/ParentHealth"));
const ParentDiscipline = lazy(() => import("./pages/parent/ParentDiscipline"));
const ParentAchievements = lazy(() => import("./pages/parent/ParentAchievements"));
const ParentEvents = lazy(() => import("./pages/parent/ParentEvents"));
const ParentComplaints = lazy(() => import("./pages/parent/ParentComplaints"));
const ParentMessages = lazy(() => import("./pages/parent/ParentMessages"));
const ParentPTM = lazy(() => import("./pages/parent/ParentPTM"));
const ParentLeave = lazy(() => import("./pages/parent/ParentLeave"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentAttendance = lazy(() => import("./pages/student/StudentAttendance"));
const StudentTimetable = lazy(() => import("./pages/student/StudentTimetable"));
const StudentQuizzes = lazy(() => import("./pages/student/StudentQuizzes"));
const StudentCourses = lazy(() => import("./pages/student/StudentCourses"));
const StudentAcademy = lazy(() => import("./pages/student/StudentAcademy"));
const StudentHomework = lazy(() => import("./pages/student/StudentHomework"));
const StudentAssignments = lazy(() => import("./pages/student/StudentAssignments"));
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentAnnouncements = lazy(() => import("./pages/student/StudentAnnouncements"));
const StudentEvents = lazy(() => import("./pages/student/StudentEvents"));
const StudentComplaints = lazy(() => import("./pages/student/StudentComplaints"));
const StudentStore = lazy(() => import("./pages/student/StudentStore"));
const StudentCertificates = lazy(() => import("./pages/student/StudentCertificates"));
const StudentAchievements = lazy(() => import("./pages/student/StudentAchievements"));
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherClasses = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherCurriculum = lazy(() => import("./pages/teacher/TeacherCurriculum"));
const Canteen = lazy(() => import("./pages/school/Canteen"));
const StudentCanteen = lazy(() => import("./pages/student/StudentCanteen"));
const TeacherTimetable = lazy(() => import("./pages/teacher/TeacherTimetable"));
const TeacherQuizzes = lazy(() => import("./pages/teacher/TeacherQuizzes"));
const TeacherCourses = lazy(() => import("./pages/teacher/TeacherCourses"));
const TeacherAcademy = lazy(() => import("./pages/teacher/TeacherAcademy"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherHomework = lazy(() => import("./pages/teacher/TeacherHomework"));
const TeacherAssignments = lazy(() => import("./pages/teacher/TeacherAssignments"));
const TeacherMarks = lazy(() => import("./pages/teacher/TeacherMarks"));
const TeacherAnnouncements = lazy(() => import("./pages/teacher/TeacherAnnouncements"));
const TeacherEvents = lazy(() => import("./pages/teacher/TeacherEvents"));
const TeacherComplaints = lazy(() => import("./pages/teacher/TeacherComplaints"));
const TeacherMessages = lazy(() => import("./pages/teacher/TeacherMessages"));
const TeacherPTM = lazy(() => import("./pages/teacher/TeacherPTM"));
const TeacherStudyMaterial = lazy(() => import("./pages/teacher/TeacherStudyMaterial"));
const PlatformLayout = lazy(() => import("./layouts/PlatformLayout"));
const PlatformLogin = lazy(() => import("./pages/platform/PlatformLogin"));
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard"));
const PlatformOrganizations = lazy(() => import("./pages/platform/PlatformOrganizations"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted">
      Loading...
    </div>
  );
}

const ADMIN_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF", "ACADEMIC_COORDINATOR", "ACCOUNTANT", "RECEPTIONIST", "LIBRARIAN", "TRANSPORT_MANAGER", "HOSTEL_WARDEN", "NURSE"];
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
      <Suspense fallback={<PageLoader />}>
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
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/onboarding" element={<RoleProtectedRoute allowedRoles={["SCHOOL_ADMIN"]}><Onboarding /></RoleProtectedRoute>} />

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
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/report-cards" element={<ReportCards />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/hr" element={<HRManagement />} />
          <Route path="/staff-attendance" element={<StaffAttendance />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/hostel" element={<Hostel />} />
          <Route path="/inventory-assets" element={<InventoryAssets />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/health" element={<Health />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/roles-permissions" element={<RolesPermissions />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/lms-overview" element={<LMSOverview />} />
          <Route path="/online-exams" element={<OnlineExamsOverview />} />
          <Route path="/communication-log" element={<CommunicationLog />} />
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
          <Route path="/parent/health" element={<ParentHealth />} />
          <Route path="/parent/discipline" element={<ParentDiscipline />} />
          <Route path="/parent/achievements" element={<ParentAchievements />} />
          <Route path="/parent/events" element={<ParentEvents />} />
          <Route path="/parent/complaints" element={<ParentComplaints />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={["STUDENT"]}><StudentLayout /></RoleProtectedRoute>}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/quizzes" element={<StudentQuizzes />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/academy" element={<StudentAcademy />} />
          <Route path="/student/canteen" element={<StudentCanteen />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/store" element={<StudentStore />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/achievements" element={<StudentAchievements />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/events" element={<StudentEvents />} />
          <Route path="/student/complaints" element={<StudentComplaints />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherLayout /></RoleProtectedRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/curriculum" element={<TeacherCurriculum />} />
          <Route path="/canteen" element={<Canteen />} />
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
          <Route path="/teacher/events" element={<TeacherEvents />} />
          <Route path="/teacher/complaints" element={<TeacherComplaints />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
