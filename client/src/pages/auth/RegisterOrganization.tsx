import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import AuthShell from "../../components/AuthShell";

const ORG_TYPES = [
  { value: "SCHOOL", label: "School" },
  { value: "ACADEMY", label: "Academy" },
  { value: "COLLEGE", label: "College" },
  { value: "INSTITUTE", label: "Institute" },
  { value: "TRAINING_CENTER", label: "Training Center" },
  { value: "TUITION_CENTER", label: "Tuition Center" },
  { value: "EDUCATION_NETWORK", label: "Education Network" },
  { value: "OTHER", label: "Other" },
];

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organizationName: "",
    organizationType: "SCHOOL",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    country: "",
    city: "",
    approxStudents: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/onboarding/register", form);
      navigate("/verify-email", { state: { email: res.data.email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <AuthShell
      eyebrow="Get started"
      title="Register your organization"
      subtitle="Set up your school, academy, or training center in a few steps."
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/login" className="text-[#4db8f0] hover:text-[#7ccbf5]">
            Log in
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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Organization name</label>
            <input value={form.organizationName} onChange={set("organizationName")} required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Organization type</label>
            <select value={form.organizationType} onChange={set("organizationType")}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white">
              {ORG_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-[#0b1024]">{t.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Your name (main administrator)</label>
            <input value={form.ownerName} onChange={set("ownerName")} required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Your email</label>
            <input type="email" value={form.ownerEmail} onChange={set("ownerEmail")} required
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Phone</label>
            <input value={form.ownerPhone} onChange={set("ownerPhone")}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Approx. students</label>
            <input type="number" min="0" value={form.approxStudents} onChange={set("approxStudents")}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">City</label>
            <input value={form.city} onChange={set("city")}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Country</label>
            <input value={form.country} onChange={set("country")}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={set("password")} required minLength={8}
              placeholder="At least 8 characters"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-light disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {loading ? "Registering..." : "Register & Continue"}
        </button>
      </form>
    </AuthShell>
  );
}
