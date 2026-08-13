import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const statusFlow = ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const statusColors: Record<string, string> = {
  REPORTED: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-600",
};

export default function Maintenance() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" });

  const load = async () => {
    const res = await api.get(`/assets/tickets?schoolId=${schoolId}`);
    setTickets(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/assets/tickets", { ...form, schoolId, reportedBy: userId });
    setForm({ title: "", description: "", priority: "MEDIUM" });
    load();
  };

  const advanceStatus = async (ticket: any) => {
    const currentIndex = statusFlow.indexOf(ticket.status);
    const nextStatus = statusFlow[currentIndex + 1];
    if (!nextStatus) return;
    await api.put(`/assets/tickets/${ticket._id}`, { status: nextStatus });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Facilities</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Maintenance Tickets</h1>
      <p className="text-muted mt-1 text-sm">Report and track facility/equipment issues.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Issue Title (e.g. Projector not working)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm col-span-2" required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm col-span-2" rows={2} required />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm col-span-2">
          <option value="LOW">Low Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="HIGH">High Priority</option>
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">+ Report Issue</button>
      </form>

      <div className="space-y-3 mt-6">
        {tickets.length === 0 && <p className="text-muted text-sm">No tickets reported yet.</p>}
        {tickets.map((t) => (
          <div key={t._id} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-4 flex justify-between items-center">
            <div>
              <h3 className="font-display font-semibold text-ink">{t.title}</h3>
              <p className="text-xs text-muted mt-1">{t.description}</p>
              <p className="text-[10px] text-muted mt-1">Reported by {t.reportedBy?.name} · Priority: {t.priority}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>{t.status}</span>
              {t.status !== "CLOSED" && (
                <button onClick={() => advanceStatus(t)} className="text-primary text-xs underline">Advance</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
