import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const redirectByRole = (role: string) => {
    if (role === "PARENT") navigate("/parent/dashboard");
    else if (role === "STUDENT") navigate("/student/dashboard");
    else if (role === "TEACHER" || role === "ACADEMY_TEACHER") navigate("/teacher/dashboard");
    else navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      redirectByRole(res.data.user.role);
    } catch (err: any) {
      if (err.response?.data?.requiresVerification) {
        navigate("/verify-email", { state: { email: err.response.data.email || email } });
        return;
      }
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    try {
      const res = await api.post("/auth/google", { credential: credentialResponse.credential });
      login(res.data.user, res.data.token);
      redirectByRole(res.data.user.role);
    } catch (err: any) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#05060d]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0b1230] via-[#151046] to-[#05060d] flex-col justify-between p-10">
        <div className="pointer-events-none absolute -top-24 -left-16 w-[24rem] h-[24rem] rounded-full bg-[#1e9fe0] opacity-25 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full bg-[#5b2a86] opacity-30 blur-[110px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 backdrop-blur flex items-center justify-center">
            <span className="font-display font-bold text-white text-sm">BC</span>
          </div>
          <div>
            <p className="font-display font-semibold text-white text-sm leading-tight">Bros Code School</p>
            <p className="text-[11px] text-white/40">Smart Education Ecosystem</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
            The Digital Connection
            <br />
            Between School &amp; Home
          </h2>
          <p className="text-white/40 text-sm max-w-sm">
            One place for admissions, attendance, fees, exams and every conversation between your school, teachers and parents.
          </p>
        </div>

        <div className="relative z-10 flex justify-center">
          <svg width="260" height="150" viewBox="0 0 260 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
            <rect x="40" y="70" width="180" height="70" rx="2" stroke="#4db8f0" strokeOpacity="0.5" strokeWidth="1.5" />
            <rect x="60" y="40" width="60" height="100" rx="2" stroke="#4db8f0" strokeOpacity="0.7" strokeWidth="1.5" />
            <path d="M60 40 L90 15 L120 40" stroke="#4db8f0" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
            <rect x="150" y="25" width="26" height="115" rx="2" stroke="#7ccbf5" strokeOpacity="0.6" strokeWidth="1.5" />
            <circle cx="163" cy="14" r="4" stroke="#7ccbf5" strokeOpacity="0.8" strokeWidth="1.5" />
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={row + "-" + col}
                  x={72 + col * 18}
                  y={58 + row * 22}
                  width="10"
                  height="12"
                  fill="#4db8f0"
                  fillOpacity="0.25"
                />
              ))
            )}
            <rect x="90" y="112" width="20" height="28" fill="#1e9fe0" fillOpacity="0.35" />
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 backdrop-blur flex items-center justify-center mb-3">
              <span className="font-display font-bold text-xl text-white">BC</span>
            </div>
            <h1 className="font-display text-lg font-bold text-white">Bros Code School Portal</h1>
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-white/40 text-xs mb-6">Enter your details to access your dashboard</p>

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
                placeholder="Enter your password"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
                required
              />
            </div>

            <div className="text-right mb-6">
              <Link to="/forgot-password" className="text-xs text-[#4db8f0] hover:text-[#7ccbf5]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e9fe0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3aacea] active:bg-[#1a8bc7] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/30 text-xs">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in failed")}
                theme="filled_black"
                shape="pill"
                width="280"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}