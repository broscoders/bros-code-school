import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Students() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", admissionNumber: "", classId: "", sectionId: "" });
  const [error, setError] = useState("");

  const loadStudents = async () => {
    const res = await api.get(`/people/students?schoolId=${schoolId}`);
    setStudents(res.data);
  };

  useEffect(() => {
    if (schoolId) loadStudents();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userRes = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "STUDENT",
        schoolId,
      });
      await api.post("/people/students", {
        schoolId,
        userId: userRes.data.user.id,
        admissionNumber: form.admissionNumber,
        classId: form.classId,
        sectionId: form.sectionId,
      });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", admissionNumber: "", classId: "", sectionId: "" });
      loadStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add student");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 mt-1">Manage all students of your school.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-800 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-900"
        >
          {showForm ? "Cancel" : "+ Add Student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Admission Number" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Class ID" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border rounded-md px-3 py-2" required />
          <input placeholder="Section ID" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border rounded-md px-3 py-2" required />
          <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded-md col-span-2">Save Student</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="p-3">Admission #</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={3} className="p-4 text-center text-slate-400">No students yet.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3">{s.admissionNumber}</td>
                  <td className="p-3">{s.userId?.name}</td>
                  <td className="p-3">{s.userId?.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
