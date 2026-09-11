import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AuthShell from "../../components/AuthShell";

interface InviteInfo {
  name: string;
  email: string;
  role: string;
  schoolName: string;
}

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/invitations/token/${token}`)
      .then((res) => setInvite(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || "This invitation link is invalid."))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/invitations/accept", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not accept invitation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={invite ? invite.schoolName : "You're invited"}
      title="Accept invitation"
      subtitle={invite ? `Set a password to join as ${invite.role.replace(/_/g, " ").toLowerCase()}` : "Checking your invitation..."}
      footer={
        <p>
          <Link to="/login" className="text-[#4db8f0] hover:text-[#7ccbf5]">
            Back to login
          </Link>
        </p>
      }
    >
      {checking ? (
        <div className="text-center py-6">
          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 text-center">
          <p className="text-danger text-sm font-medium">{loadError}</p>
        </div>
      ) : success ? (
        <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-center">
          <p className="text-success text-sm font-medium">Account created! Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
              <p className="text-danger text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Name</label>
            <input
              type="text"
              value={invite?.name || ""}
              disabled
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white/60"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <input
              type="email"
              value={invite?.email || ""}
              disabled
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white/60"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              minLength={8}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-light active:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? "Creating account..." : "Accept & Create Account"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
