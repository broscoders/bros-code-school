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
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-dark px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-accent text-primary-dark flex items-center justify-center font-display font-bold text-lg mb-3">
            BC
          </div>
          <h1 className="font-display text-xl font-bold text-white">Bros Code School</h1>
          <p className="text-white/50 text-xs mt-1">Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl shadow-lg">
          {error && <p className="text-danger mb-4 text-sm">{error}</p>}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
