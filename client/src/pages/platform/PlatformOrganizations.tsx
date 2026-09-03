import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";

const ORG_TYPES = ["SCHOOL", "ACADEMY", "COLLEGE", "INSTITUTE", "TRAINING_CENTER", "TUITION_CENTER", "EDUCATION_NETWORK", "OTHER"];
const PLAN_NAMES = ["Trial", "Basic", "Pro", "Enterprise"];

export default function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [planModalOrg, setPlanModalOrg] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ planName: "Trial", subscriptionStatus: "TRIAL", subscriptionExpiresAt: "" });
  const [form, setForm] = useState({
    name: "", type: "SCHOOL", ownerName: "", ownerEmail: "", ownerPhone: "",
    country: "", city: "", adminName: "", adminEmail: "", adminPassword: "",
  });

  const load = async () => {
    const res = await platformApi.get("/organizations");
    setOrgs(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await platformApi.post("/organizations", form);
      setShowForm(false);
      setForm({ name: "", type: "SCHOOL", ownerName: "", ownerEmail: "", ownerPhone: "", country: "", city: "", adminName: "", adminEmail: "", adminPassword: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create organization");
    }
  };

  const toggleStatus = async (org: any) => {
    const newStatus = org.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await platformApi.put(`/organizations/${org._id}/status`, { status: newStatus });
    load();
  };

  const openPlanModal = async (org: any) => {
    setPlanModalOrg(org);
    setPlanForm({ planName: org.planName || "Trial", subscriptionStatus: org.subscriptionStatus || "TRIAL", subscriptionExpiresAt: org.subscriptionExpiresAt ? org.subscriptionExpiresAt.slice(0, 10) : "" });
    const res = await platformApi.get(`/organizations/${org._id}/usage`);
    setUsage(res.data);
  };

  const savePlan = async () => {
    await platformApi.put(`/organizations/${planModalOrg._id}/plan`, planForm);
    setPlanModalOrg(null);
    setUsage(null);
    load();
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-surface-soft text-ink-soft",
    ACTIVE: "bg-success/10 text-success",
    SUSPENDED: "bg-danger/10 text-danger",
    ARCHIVED: "bg-surface-soft text-muted",
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-warning font-semibold">Platform</p>
          <h1 className="text-2xl font-bold text-white mt-1">Organizations</h1>
          <p className="text-muted mt-1 text-sm">Every customer running on Bros Code School.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-warning-soft0 text-ink px-4 py-2 rounded-lg text-sm font-semibold hover:bg-warning transition-colors">
          {showForm ? "Cancel" : "+ New Organization"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-slate-800 rounded-xl p-5 mt-4 grid grid-cols-2 gap-3">
          {error && <p className="text-danger text-sm col-span-2">{error}</p>}
          <input placeholder="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2">
            {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <input placeholder="Owner Name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Owner Email" type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Owner Phone" value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />

          <p className="text-xs text-muted col-span-2 mt-2">First School Admin account for this organization (optional - can be created later instead):</p>
          <input placeholder="Admin Name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Admin Email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Admin Temporary Password" type="text" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2" />

          <button type="submit" className="bg-warning-soft0 text-ink px-4 py-2 rounded-lg text-sm font-semibold col-span-2 hover:bg-warning transition-colors">Create Organization</button>
        </form>
      )}

      <div className="bg-surface border border-slate-800 rounded-xl mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Owner</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No organizations yet.</td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org._id} className="border-t border-slate-800">
                  <td className="p-3 text-white">{org.name}</td>
                  <td className="p-3 text-muted">{org.type}</td>
                  <td className="p-3 text-muted">{org.ownerName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[org.status]}`}>{org.status}</span>
                  </td>
                  <td className="p-3 text-muted">{org.planName}</td>
                  <td className="p-3 flex gap-3">
                    {org.status !== "ARCHIVED" && (
                      <button onClick={() => toggleStatus(org)} className="text-warning text-xs underline">
                        {org.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                      </button>
                    )}
                    <button onClick={() => openPlanModal(org)} className="text-warning text-xs underline">Manage Plan</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {planModalOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPlanModalOrg(null)}>
          <div className="bg-surface border border-slate-800 rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-semibold mb-1">Manage Plan - {planModalOrg.name}</h2>
            {usage && (
              <div className="text-xs text-muted space-y-1 my-3 bg-surface-soft rounded-lg p-3">
                <div className="flex justify-between">
                  <span>Students</span>
                  <span className={usage.studentLimit && usage.studentCount >= usage.studentLimit ? "text-danger font-medium" : "text-ink"}>
                    {usage.studentCount}{usage.studentLimit ? ` / ${usage.studentLimit}` : " (unlimited)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff</span>
                  <span className={usage.staffLimit && usage.staffCount >= usage.staffLimit ? "text-danger font-medium" : "text-ink"}>
                    {usage.staffCount}{usage.staffLimit ? ` / ${usage.staffLimit}` : " (unlimited)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Branches</span>
                  <span className="text-ink">{usage.branchCount} / {usage.branchLimit}</span>
                </div>
              </div>
            )}
            <label className="block text-xs text-muted mt-3 mb-1">Plan</label>
            <select value={planForm.planName} onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full">
              {PLAN_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="block text-xs text-muted mt-3 mb-1">Subscription Status</label>
            <select value={planForm.subscriptionStatus} onChange={(e) => setPlanForm({ ...planForm, subscriptionStatus: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full">
              {["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <label className="block text-xs text-muted mt-3 mb-1">Renews / Expires On</label>
            <input type="date" value={planForm.subscriptionExpiresAt} onChange={(e) => setPlanForm({ ...planForm, subscriptionExpiresAt: e.target.value })} className="bg-surface-soft border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPlanModalOrg(null)} className="flex-1 bg-surface-soft text-ink px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={savePlan} className="flex-1 bg-warning-soft0 text-ink px-4 py-2 rounded-lg text-sm font-semibold hover:bg-warning transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
