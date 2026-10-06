import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Megaphone } from "lucide-react";
import { useApiAction } from "../../hooks/useApiAction";

const PRIORITY_STYLES: Record<string, string> = {
  NORMAL: "text-accent bg-accent-soft",
  HIGH: "text-warning bg-warning/10",
  URGENT: "text-danger bg-danger/10",
};

export default function Announcements() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", targetAudience: "ALL", classId: "", priority: "NORMAL", expiresAt: "" });
  const [classes, setClasses] = useState<any[]>([]);
  const { error: actionError, run } = useApiAction();

  const load = async () => {
    try {
      const res = await api.get(`/announcements?schoolId=${schoolId}`);
      setList(res.data);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    if (schoolId) {
      load();
      api.get("/academics/classes").then((res) => setClasses(res.data)).catch(() => setClasses([]));
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await run(async () => {
      await api.post("/announcements", { ...form, expiresAt: form.expiresAt || undefined, classId: form.targetAudience === "CLASS" ? form.classId : undefined });
      setForm({ title: "", message: "", targetAudience: "ALL", classId: "", priority: "NORMAL", expiresAt: "" });
      load();
    }, "Could not publish the announcement");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this announcement? Everyone will stop seeing it.")) return;
    await run(async () => {
      await api.delete(`/announcements/${id}`);
      load();
    }, "Could not delete the announcement");
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Communication</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Megaphone size={22} className="text-primary" />Announcements</h1>
        <p className="text-muted mt-1 text-sm">Publish announcements to your school community.</p>
      </div>

      {actionError && <p className="text-danger text-sm mt-4">{actionError}</p>}

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 space-y-3">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
        <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" rows={3} required />
        <div className="flex flex-wrap gap-3">
          <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="ALL">Everyone</option>
            <option value="PARENTS">Parents</option>
            <option value="STUDENTS">Students</option>
            <option value="TEACHERS">Teachers</option>
            <option value="CLASS">One class</option>
          </select>
          {form.targetAudience === "CLASS" && (
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm">
            <option value="NORMAL">Normal priority</option>
            <option value="HIGH">High priority</option>
            <option value="URGENT">Urgent</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Expires (optional)</label>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">+ Publish</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">No announcements yet.</p>}
        {list.map((a) => (
          <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-display font-semibold text-primary-dark">{a.title}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {a.priority && a.priority !== "NORMAL" && (
                  <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[a.priority]}`}>{a.priority}</span>
                )}
                <span className="text-[10px] uppercase tracking-wide text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full">{a.targetAudience}</span>
              </div>
            </div>
            <p className="text-sm text-muted mt-1">{a.message}</p>
            <div className="flex items-center justify-between mt-2">
              {a.expiresAt ? <p className="text-[11px] text-muted/70">Expires {new Date(a.expiresAt).toLocaleDateString()}</p> : <span />}
              <button type="button" onClick={() => remove(a._id)} className="text-danger text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

