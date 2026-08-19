import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";

const ORG_TYPES = ["SCHOOL", "ACADEMY", "COLLEGE", "INSTITUTE", "TRAINING_CENTER", "TUITION_CENTER", "EDUCATION_NETWORK", "OTHER"];

export default function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
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

  const statusColors: Record<string, string> = {
    PENDING: "bg-slate-700 text-slate-300",
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    SUSPENDED: "bg-red-500/10 text-red-400",
    ARCHIVED: "bg-slate-800 text-slate-500",
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Platform</p>
          <h1 className="text-2xl font-bold text-white mt-1">Organizations</h1>
          <p className="text-slate-400 mt-1 text-sm">Every customer running on Bros Code School.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors">
          {showForm ? "Cancel" : "+ New Organization"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4 grid grid-cols-2 gap-3">
          {error && <p className="text-red-400 text-sm col-span-2">{error}</p>}
          <input placeholder="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2">
            {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <input placeholder="Owner Name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Owner Email" type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" required />
          <input placeholder="Owner Phone" value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />

          <p className="text-xs text-slate-500 col-span-2 mt-2">First School Admin account for this organization (optional - can be created later instead):</p>
          <input placeholder="Admin Name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Admin Email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Admin Temporary Password" type="text" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm col-span-2" />

          <button type="submit" className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold col-span-2 hover:bg-amber-400 transition-colors">Create Organization</button>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs">
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
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No organizations yet.</td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org._id} className="border-t border-slate-800">
                  <td className="p-3 text-white">{org.name}</td>
                  <td className="p-3 text-slate-400">{org.type}</td>
                  <td className="p-3 text-slate-400">{org.ownerName}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[org.status]}`}>{org.status}</span>
                  </td>
                  <td className="p-3 text-slate-400">{org.planName}</td>
                  <td className="p-3">
                    {org.status !== "ARCHIVED" && (
                      <button onClick={() => toggleStatus(org)} className="text-amber-400 text-xs underline">
                        {org.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                      </button>
                    )}
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
