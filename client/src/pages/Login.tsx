import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "PARENT") navigate("/parent/dashboard");
      else if (role === "STUDENT") navigate("/student/dashboard");
      else if (role === "TEACHER" || role === "ACADEMY_TEACHER") navigate("/teacher/dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="hidden lg:flex w-1/2 bg-primary-dark relative overflow-hidden flex-col justify-center items-center p-12">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center mb-6">
            <span className="font-display font-bold text-2xl text-accent">BC</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Bros Code School</h1>
          <p className="text-white/60 text-sm max-w-xs">One platform for administration, teachers, students and parents.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">Sign in</p>
          <h2 className="font-display text-2xl font-bold text-primary-dark mt-1 mb-6">Welcome back</h2>
          <form onSubmit={handleSubmit}>
            {error && <p className="text-danger mb-4 text-sm">{error}</p>}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-black/10 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-medium text-muted mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-black/10 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
