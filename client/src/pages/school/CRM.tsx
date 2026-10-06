import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useApiAction } from "../../hooks/useApiAction";

const statusColors: Record<string, string> = {
  NEW: "bg-white/5 text-ink-soft",
  CONTACTED: "bg-primary/10 text-primary",
  DEMO_SCHEDULED: "bg-warning-soft text-warning",
  CONVERTED: "bg-success-soft text-success",
  LOST: "bg-danger-soft text-danger",
};

export default function CRM() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [leads, setLeads] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", source: "", interestedIn: "" });

  const { error: actionError, run } = useApiAction();
  const [classes, setClasses] = useState<any[]>([]);
  const [converting, setConverting] = useState<{ id: string; name: string } | null>(null);
  const [convertClass, setConvertClass] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/crm/leads?schoolId=${schoolId}`);
      setLeads(res.data);
    } catch {
      setLeads([]);
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
      await api.post("/crm/leads", form);
      setForm({ name: "", contact: "", source: "", interestedIn: "" });
      load();
    }, "Could not save the lead");
  };

  const updateStatus = async (lead: any, status: string) => {
    // converting needs a class - an admission can't be created without one
    if (status === "CONVERTED") {
      setConverting({ id: lead._id, name: lead.name });
      setConvertClass("");
      return;
    }
    await run(async () => {
      await api.put(`/crm/leads/${lead._id}`, { status });
      load();
    }, "Could not update the lead");
  };

  const confirmConvert = async () => {
    if (!converting || !convertClass) return;
    const ok = await run(async () => {
      const res = await api.put(`/crm/leads/${converting.id}`, { status: "CONVERTED", desiredClassId: convertClass });
      setNotice(res.data.admissionCreated ? `${converting.name} was converted and added to Admissions.` : `${converting.name} was converted (an admission already existed).`);
      load();
    }, "Could not convert the lead");
    if (ok) setConverting(null);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Admissions</p>
        <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Leads & Inquiries</h1>
        <p className="text-muted mt-1 text-sm">Track inquiries from first contact to admission.</p>
      </div>
      {actionError && <p className="text-danger text-sm mb-3">{actionError}</p>}
      {notice && <p className="text-success text-sm mb-3">{notice}</p>}
      {converting && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm">Convert <b>{converting.name}</b> - which class is the child applying for?</span>
          <select value={convertClass} onChange={(e) => setConvertClass(e.target.value)} className="border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">Select class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button onClick={confirmConvert} disabled={!convertClass} className="bg-primary text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-50">Convert</button>
          <button onClick={() => setConverting(null)} className="text-xs text-muted">Cancel</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Contact (phone/email)" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required />
        <input placeholder="Source (e.g. Facebook, Walk-in)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Interested In (e.g. Grade 9, MDCAT)" value={form.interestedIn} onChange={(e) => setForm({ ...form, interestedIn: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Add Lead</button>
      </form>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
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
                    <select value="" onChange={(e) => e.target.value && updateStatus(l, e.target.value)} className="text-xs border border-border rounded-md px-2 py-1">
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
    </div>
  );
}

