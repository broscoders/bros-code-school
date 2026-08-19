import { Navigate } from "react-router-dom";
import { usePlatformAuthStore } from "../store/platformAuthStore";

interface Props {
  children: React.ReactNode;
}

export default function PlatformProtectedRoute({ children }: Props) {
  const token = usePlatformAuthStore((s) => s.token);
  if (!token) return <Navigate to="/platform/login" />;
  return <>{children}</>;
}
