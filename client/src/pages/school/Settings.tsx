import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Settings as SettingsIcon } from "lucide-react";
import FileUpload from "../../components/FileUpload";

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
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><SettingsIcon size={22} className="text-primary" />School Settings</h1>
      <p className="text-muted mt-1 text-sm">Branding and contact information for your school.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3 max-w-2xl">
        {msg && <p className="text-success text-sm col-span-2">{msg}</p>}
        <input placeholder="School Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" required />

        <div className="col-span-2 flex items-center gap-4">
          {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-border" />}
          <FileUpload folder="bros-code-school/branding" label="Upload school logo" onUploaded={(url) => setForm({ ...form, logoUrl: url })} />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">Primary Color</label>
          <input type="color" value={form.primaryColor || "#4F46E5"} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-9 border border-border rounded-lg" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Secondary Color</label>
          <input type="color" value={form.secondaryColor || "#F59E0B"} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-full h-9 border border-border rounded-lg" />
        </div>
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" />
        <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">Save Settings</button>
      </form>
    </div>
  );
}

