import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import AuthShell from "../../components/AuthShell";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState((location.state as any)?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "PARENT") navigate("/parent/dashboard");
      else if (role === "STUDENT") navigate("/student/dashboard");
      else if (role === "TEACHER" || role === "ACADEMY_TEACHER") navigate("/teacher/dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Incorrect code, try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setInfo("A new code has been sent to your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Verify your email"
      subtitle="Enter the 6-digit code we emailed you"
      footer={
        <p>
          Wrong account?{" "}
          <Link to="/login" className="text-[#4db8f0] hover:text-[#7ccbf5]">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
            <p className="text-danger text-xs font-medium">{error}</p>
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <p className="text-success text-xs font-medium">{info}</p>
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

        <div className="mb-6">
          <label className="block text-xs font-medium text-white/60 mb-1.5">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e9fe0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3aacea] active:bg-[#1a8bc7] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="w-full text-xs text-[#4db8f0] hover:text-[#7ccbf5] mt-4 disabled:opacity-50"
        >
          {resending ? "Resending..." : "Didn't get a code? Resend"}
        </button>
      </form>
    </AuthShell>
  );
}

