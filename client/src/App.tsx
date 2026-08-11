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
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
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
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
