import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import AuthShell from "../../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="No worries"
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <p>
          Remembered it?{" "}
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

        <div className="mb-6">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e9fe0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3aacea] active:bg-[#1a8bc7] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? "Sending..." : "Send Reset Code"}
        </button>
      </form>
    </AuthShell>
  );
}

