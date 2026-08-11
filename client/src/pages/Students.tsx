import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Students() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", admissionNumber: "", classId: "", sectionId: "" });
  const [error, setError] = useState("");

  const loadStudents = async () => {
    const res = await api.get(`/people/students?schoolId=${schoolId}`);
    setStudents(res.data);
  };

  const loadClasses = async () => {
    const res = await api.get(`/academics/classes?schoolId=${schoolId}`);
    setClasses(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      loadStudents();
      loadClasses();
    }
  }, [schoolId]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/sections?classId=${form.classId}`).then((res) => setSections(res.data));
    } else {
      setSections([]);
    }
  }, [form.classId]);

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
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">People</p>
          <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Students</h1>
          <p className="text-muted mt-1 text-sm">Manage all students of your school.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <input placeholder="Admission Number" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required>
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
            <option value="">Select Section</option>
            {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Save Student</button>
        </form>
      )}

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Admission #</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted">No students yet — add your first one above.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-t border-black/5">
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
