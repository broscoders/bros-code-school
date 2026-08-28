import { useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import { usePlatformAuthStore } from "../../store/platformAuthStore";

export default function PlatformLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = usePlatformAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await platformApi.post("/auth/login", { email, password });
      login(res.data.admin, res.data.token);
      navigate("/platform/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-warning-soft0 text-ink flex items-center justify-center font-bold text-lg mb-3">
            BC
          </div>
          <h1 className="text-xl font-bold text-white">Platform Admin</h1>
          <p className="text-muted text-xs mt-1">Bros Code School - internal control panel</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl border border-slate-800">
          {error && <p className="text-danger mb-4 text-sm">{error}</p>}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" required />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" required />
          </div>
          <button type="submit" className="w-full bg-warning-soft0 text-ink py-2.5 rounded-lg text-sm font-semibold hover:bg-warning transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
