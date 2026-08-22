import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    api
      .get("/schools/public/branding")
      .then((res) => setBrandLogo(res.data?.logoUrl || null))
      .catch(() => {});
  }, []);

  const redirectByRole = (role: string, mustChangePassword?: boolean) => {
    if (mustChangePassword) {
      navigate("/change-password-required");
      return;
    }
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
      redirectByRole(res.data.user.role, res.data.user.mustChangePassword);
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
      redirectByRole(res.data.user.role, res.data.user.mustChangePassword);
    } catch (err: any) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-end px-6 lg:px-20 py-10 bg-[#05060d] bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        {brandLogo ? (
          <img src={brandLogo} alt="" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-[#1e9fe0] text-white flex items-center justify-center font-display font-bold text-sm shadow-lg">
            BC
          </div>
        )}
        <div>
          <p className="font-display font-semibold text-white text-base leading-tight drop-shadow">Bros Code School</p>
          <p className="text-xs text-white/70 drop-shadow">Smart Education Ecosystem</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-[#0b1024]/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
        <h2 className="font-display text-2xl font-bold text-white mb-1">Welcome back ðŸ‘‹</h2>
        <p className="text-white/50 text-xs mb-6">Sign in to access your dashboard</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
              <p className="text-danger text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1e9fe0]/50 focus:border-[#1e9fe0]/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right mb-6">
            <Link to="/forgot-password" className="text-xs text-[#4db8f0] hover:text-[#7ccbf5]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#1e9fe0] to-[#3b5fe0] text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/30 text-xs">or continue with</span>
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

          <p className="flex items-center justify-center gap-1.5 text-white/35 text-[11px] mt-6">
            <ShieldCheck size={13} />
            Your data is safe and secure with us
          </p>
        </form>
      </div>
    </div>
  );
}