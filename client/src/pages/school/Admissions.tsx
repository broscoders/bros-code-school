import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const statusColors: Record<string, string> = {
  APPLICATION: "bg-white/5 text-ink-soft",
  REVIEW: "bg-warning-soft text-warning",
  INTERVIEW: "bg-primary/10 text-primary",
  APPROVED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger",
  CONVERTED: "bg-accent-soft text-accent",
};

export default function Admissions() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [classes, setClasses] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ applicantName: "", parentName: "", parentContact: "", desiredClassId: "", academicSystem: "" });

  const load = async () => {
    const res = await api.get(`/admissions?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/academics/classes?schoolId=${schoolId}`).then((res) => setClasses(res.data));
      load();
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/admissions", { ...form, schoolId });
    setForm({ applicantName: "", parentName: "", parentContact: "", desiredClassId: "", academicSystem: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/admissions/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Enrollment</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Admissions</h1>
      <p className="text-muted mt-1 text-sm">Manage the admission pipeline from application to approval.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Applicant Name" value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Parent Name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Parent Contact" value={form.parentContact} onChange={(e) => setForm({ ...form, parentContact: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <select value={form.desiredClassId} onChange={(e) => setForm({ ...form, desiredClassId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Desired Class</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input placeholder="Academic System (e.g. Matric)" value={form.academicSystem} onChange={(e) => setForm({ ...form, academicSystem: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Submit Application</button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Applicant</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No applications yet.</td></tr>
            ) : (
              list.map((a) => (
                <tr key={a._id} className="border-t border-border">
                  <td className="p-3">{a.applicantName}</td>
                  <td className="p-3">{a.parentName}</td>
                  <td className="p-3">{a.parentContact}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="p-3">
                    <select
                      value=""
                      onChange={(e) => e.target.value && updateStatus(a._id, e.target.value)}
                      className="text-xs border border-border rounded-md px-2 py-1"
                    >
                      <option value="">Change status</option>
                      <option value="REVIEW">Review</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
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


