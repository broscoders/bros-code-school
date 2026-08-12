import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "PARENT") navigate("/parent/dashboard");
      else if (role === "STUDENT") navigate("/student/dashboard");
      else if (role === "TEACHER" || role === "ACADEMY_TEACHER") navigate("/teacher/dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      if (err.response?.data?.requiresVerification) {
        navigate("/verify-email", { state: { email } });
        return;
      }
      setError(err.response?.data?.message || "Wrong input, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome to"
      title="Log in"
      subtitle="Enter your credentials to continue"
      footer={
        <>
          <p>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-[#4db8f0] hover:text-[#7ccbf5]">
              Register
            </Link>
          </p>
          <p className="mt-1">One platform for administration, teachers, students and parents.</p>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
            <p className="text-danger text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
            required
          />
        </div>

        <div className="mb-2">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
            required
          />
        </div>

        <div className="flex justify-end mb-6">
          <Link to="/forgot-password" className="text-xs text-[#4db8f0] hover:text-[#7ccbf5] transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e9fe0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3aacea] active:bg-[#1a8bc7] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </AuthShell>
  );
}
