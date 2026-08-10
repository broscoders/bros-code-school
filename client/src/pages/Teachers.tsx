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
          <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage all teachers of your school.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-900">
          {showForm ? "Cancel" : "+ Add Teacher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="border rounded-md px-3 py-2 col-span-2" />
          <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-md col-span-2">Save Teacher</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="p-3">Employee ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Qualification</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400">No teachers yet.</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t._id} className="border-t">
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
