import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Settings() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [form, setForm] = useState({ name: "", logoUrl: "", primaryColor: "", secondaryColor: "", address: "", contactEmail: "", contactPhone: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (schoolId) {
      api.get(`/schools/${schoolId}`).then((res) => {
        setForm({
          name: res.data.name || "",
          logoUrl: res.data.logoUrl || "",
          primaryColor: res.data.primaryColor || "",
          secondaryColor: res.data.secondaryColor || "",
          address: res.data.address || "",
          contactEmail: res.data.contactEmail || "",
          contactPhone: res.data.contactPhone || "",
        });
      });
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put(`/schools/${schoolId}`, form);
    setMsg("Settings saved.");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Configuration</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">School Settings</h1>
      <p className="text-muted mt-1 text-sm">Branding and contact information for your school.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-2 gap-3 max-w-2xl">
        {msg && <p className="text-success text-sm col-span-2">{msg}</p>}
        <input placeholder="School Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />
        <input placeholder="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" />
        <div>
          <label className="text-xs text-muted block mb-1">Primary Color</label>
          <input type="color" value={form.primaryColor || "#1D3557"} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-9 border border-black/10 rounded-md" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Secondary Color</label>
          <input type="color" value={form.secondaryColor || "#C9A227"} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-full h-9 border border-black/10 rounded-md" />
        </div>
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" />
        <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Save Settings</button>
      </form>
    </div>
  );
}
