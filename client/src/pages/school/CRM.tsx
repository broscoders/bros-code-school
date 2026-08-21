import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const statusColors: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  DEMO_SCHEDULED: "bg-amber-100 text-amber-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

export default function CRM() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [leads, setLeads] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", source: "", interestedIn: "" });

  const load = async () => {
    const res = await api.get(`/crm/leads?schoolId=${schoolId}`);
    setLeads(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/crm/leads", { ...form, schoolId });
    setForm({ name: "", contact: "", source: "", interestedIn: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/crm/leads/${id}`, { status });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Admissions</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Leads & Inquiries</h1>
      <p className="text-muted mt-1 text-sm">Track inquiries from first contact to admission.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Contact (phone/email)" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Source (e.g. Facebook, Walk-in)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Interested In (e.g. Grade 9, MDCAT)" value={form.interestedIn} onChange={(e) => setForm({ ...form, interestedIn: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Add Lead</button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Interested In</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No leads yet.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l._id} className="border-t border-border">
                  <td className="p-3">{l.name}</td>
                  <td className="p-3">{l.contact}</td>
                  <td className="p-3">{l.source || "-"}</td>
                  <td className="p-3">{l.interestedIn || "-"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[l.status]}`}>{l.status}</span>
                  </td>
                  <td className="p-3">
                    <select value="" onChange={(e) => e.target.value && updateStatus(l._id, e.target.value)} className="text-xs border border-border rounded-md px-2 py-1">
                      <option value="">Update status</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="LOST">Lost</option>
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

