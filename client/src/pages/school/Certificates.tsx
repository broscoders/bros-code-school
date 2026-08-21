import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Certificates() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", title: "", type: "COMPLETION" });

  const load = async () => {
    const res = await api.get(`/crm/certificates?schoolId=${schoolId}`);
    setCerts(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      load();
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/crm/certificates", { ...form, schoolId });
    setForm({ studentId: "", title: "", type: "COMPLETION" });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Recognition</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Certificates</h1>
      <p className="text-muted mt-1 text-sm">Issue and track certificates for students.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required>
          <option value="">Select Student</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
        </select>
        <input placeholder="Certificate Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm">
          <option value="COMPLETION">Completion</option>
          <option value="ACHIEVEMENT">Achievement</option>
          <option value="PARTICIPATION">Participation</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Issue Certificate</button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Student</th>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Certificate #</th>
              <th className="p-3 font-medium">Issued</th>
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No certificates issued yet.</td></tr>
            ) : (
              certs.map((c) => (
                <tr key={c._id} className="border-t border-border">
                  <td className="p-3">{c.studentId?.userId?.name}</td>
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.type}</td>
                  <td className="p-3 text-xs text-muted">{c.certificateNumber}</td>
                  <td className="p-3">{new Date(c.issueDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

