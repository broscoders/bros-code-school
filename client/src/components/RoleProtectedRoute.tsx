import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

const roleHome: Record<string, string> = {
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  ACADEMY_TEACHER: "/teacher/dashboard",
};

export default function RoleProtectedRoute({ children, allowedRoles }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Navigate to="/login" />;
  if (user && !allowedRoles.includes(user.role)) {
    const redirectTo = roleHome[user.role] || "/dashboard";
    return <Navigate to={redirectTo} />;
  }
  return <>{children}</>;
}
