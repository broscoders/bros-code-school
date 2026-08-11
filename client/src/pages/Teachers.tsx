import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Teachers() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", employeeId: "", qualification: "" });
  const [error, setError] = useState("");

  const loadTeachers = async () => {
    const res = await api.get(`/people/teachers?schoolId=${schoolId}`);
    setTeachers(res.data);
  };

  useEffect(() => {
    if (schoolId) loadTeachers();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userRes = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "TEACHER",
        schoolId,
      });
      await api.post("/people/teachers", {
        schoolId,
        userId: userRes.data.user.id,
        employeeId: form.employeeId,
        qualification: form.qualification,
      });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", employeeId: "", qualification: "" });
      loadTeachers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add teacher");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">People</p>
          <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Teachers</h1>
          <p className="text-muted mt-1 text-sm">Manage all teachers of your school.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
          {showForm ? "Cancel" : "+ Add Teacher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Save Teacher</button>
        </form>
      )}

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Employee ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Qualification</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No teachers yet — add your first one above.</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t._id} className="border-t border-black/5">
                  <td className="p-3">{t.employeeId}</td>
                  <td className="p-3">{t.userId?.name}</td>
                  <td className="p-3">{t.userId?.email}</td>
                  <td className="p-3">{t.qualification}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
