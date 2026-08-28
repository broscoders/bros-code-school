import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import AuthShell from "../../components/AuthShell";

export default function ChangePasswordRequired() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);

  const redirectByRole = (role: string) => {
    if (role === "PARENT") navigate("/parent/dashboard");
    else if (role === "STUDENT") navigate("/student/dashboard");
    else if (role === "TEACHER" || role === "ACADEMY_TEACHER") navigate("/teacher/dashboard");
    else navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      if (user && token) {
        login({ ...user, mustChangePassword: false } as any, token);
        redirectByRole(user.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="One more step"
      title="Set a new password"
      subtitle="For your security, please set your own password before continuing."
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
            <p className="text-danger text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Current (temporary) password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="The password you were emailed"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/60 mb-1.5">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-light disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving..." : "Set Password & Continue"}
        </button>
      </form>
    </AuthShell>
  );
}