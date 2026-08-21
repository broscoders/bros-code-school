import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Discipline() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [students, setStudents] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", incidentType: "WARNING", description: "", parentNotified: true });

  const load = async () => {
    const res = await api.get(`/system/discipline?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      load();
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/system/discipline", { ...form, schoolId, reportedBy: userId });
    setForm({ studentId: "", incidentType: "WARNING", description: "", parentNotified: true });
    load();
  };

  const resolve = async (id: string) => {
    await api.put(`/system/discipline/${id}`, { status: "RESOLVED" });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Behavior</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Discipline Management</h1>
      <p className="text-muted mt-1 text-sm">Record and track student discipline incidents.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" required>
          <option value="">Select Student</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
        </select>
        <select value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm">
          <option value="WARNING">Warning</option>
          <option value="MINOR">Minor</option>
          <option value="MAJOR">Major</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.parentNotified} onChange={(e) => setForm({ ...form, parentNotified: e.target.checked })} />
          Notify parent
        </label>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" rows={3} required />
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">+ Record Incident</button>
      </form>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Student</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No incidents recorded.</td></tr>
            ) : (
              list.map((i) => (
                <tr key={i._id} className="border-t border-border">
                  <td className="p-3">{i.studentId?.userId?.name}</td>
                  <td className="p-3">{i.incidentType}</td>
                  <td className="p-3 text-muted text-xs">{i.description}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.status === "RESOLVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{i.status}</span>
                  </td>
                  <td className="p-3">
                    {i.status === "OPEN" && <button onClick={() => resolve(i._id)} className="text-primary text-xs underline">Resolve</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

