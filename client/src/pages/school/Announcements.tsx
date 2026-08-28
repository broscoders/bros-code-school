import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Megaphone } from "lucide-react";

export default function Announcements() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", targetAudience: "ALL" });

  const load = async () => {
    const res = await api.get(`/announcements?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/announcements", { ...form, schoolId, createdBy: userId });
    setForm({ title: "", message: "", targetAudience: "ALL" });
    load();
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Communication</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Megaphone size={22} className="text-primary" />Announcements</h1>
        <p className="text-muted mt-1 text-sm">Publish announcements to your school community.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 space-y-3">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
        <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" rows={3} required />
        <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm">
          <option value="ALL">Everyone</option>
          <option value="PARENTS">Parents</option>
          <option value="STUDENTS">Students</option>
          <option value="TEACHERS">Teachers</option>
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">+ Publish</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">No announcements yet.</p>}
        {list.map((a) => (
          <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{a.title}</h3>
              <span className="text-[10px] uppercase tracking-wide text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full">{a.targetAudience}</span>
            </div>
            <p className="text-sm text-muted mt-1">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


