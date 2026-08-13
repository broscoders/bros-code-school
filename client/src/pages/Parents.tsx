import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Parents() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", relationship: "Father", childrenIds: [] as string[] });
  const [error, setError] = useState("");

  const loadParents = async () => {
    const res = await api.get(`/people/parents?schoolId=${schoolId}`);
    setParents(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      loadParents();
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
    }
  }, [schoolId]);

  const toggleChild = (id: string) => {
    setForm((f) => ({
      ...f,
      childrenIds: f.childrenIds.includes(id) ? f.childrenIds.filter((c) => c !== id) : [...f.childrenIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userRes = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "PARENT",
        schoolId,
      });
      await api.post("/people/parents", {
        schoolId,
        userId: userRes.data.user.id,
        relationship: form.relationship,
        children: form.childrenIds,
      });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", relationship: "Father", childrenIds: [] });
      loadParents();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add parent");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">People</p>
          <h1 className="font-display text-2xl font-bold text-ink mt-1">Parents</h1>
          <p className="text-muted mt-1 text-sm">Manage parent accounts and link them to children.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          {showForm ? "Cancel" : "+ Add Parent"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-4 grid grid-cols-2 gap-4">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
          <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm">
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Guardian">Guardian</option>
          </select>
          <div className="col-span-2">
            <p className="text-xs text-muted mb-2">Select children to link:</p>
            <div className="max-h-40 overflow-y-auto border border-black/10 rounded-lg p-2 space-y-1">
              {students.length === 0 && <p className="text-xs text-muted">No students found. Add students first.</p>}
              {students.map((s) => (
                <label key={s._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.childrenIds.includes(s._id)} onChange={() => toggleChild(s._id)} />
                  {s.userId?.name} ({s.admissionNumber})
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">Save Parent</button>
        </form>
      )}

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Relationship</th>
              <th className="p-3 font-medium">Children</th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No parents yet — add your first one above.</td></tr>
            ) : (
              parents.map((p) => (
                <tr key={p._id} className="border-t border-black/5">
                  <td className="p-3">{p.userId?.name}</td>
                  <td className="p-3">{p.userId?.email}</td>
                  <td className="p-3">{p.relationship}</td>
                  <td className="p-3">{p.children?.length || 0} linked</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
