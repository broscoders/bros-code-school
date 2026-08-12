import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useSchoolStore, DEFAULT_LOGO_URL } from "../store/schoolStore";
import { Upload } from "lucide-react";

const CAN_EDIT_BRANDING = ["SCHOOL_ADMIN", "PRINCIPAL"];

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId;
  const fetchSchool = useSchoolStore((s) => s.fetchSchool);
  const canEdit = CAN_EDIT_BRANDING.includes(user?.role || "");

  const [form, setForm] = useState({ name: "", logoUrl: "", primaryColor: "", secondaryColor: "", address: "", contactEmail: "", contactPhone: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schoolId) {
      api.get(`/schools/${schoolId}`).then((res) => {
        setForm({
          name: res.data.name || "",
          logoUrl: res.data.logoUrl || "",
          primaryColor: res.data.primaryColor || "#1D3557",
          secondaryColor: res.data.secondaryColor || "#C9A227",
          address: res.data.address || "",
          contactEmail: res.data.contactEmail || "",
          contactPhone: res.data.contactPhone || "",
        });
      });
    }
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !schoolId) return;
    setError("");
    try {
      await api.put(`/schools/${schoolId}`, form);
      await fetchSchool(schoolId);
      setMsg("Settings saved.");
      setTimeout(() => setMsg(""), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save settings");
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "bros-code-school/logos");
      const res = await api.post("/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, logoUrl: res.data.url }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Logo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Configuration</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">School Settings</h1>
      <p className="text-muted mt-1 text-sm">Branding, theme color and contact information for your school.</p>

      {!canEdit && (
        <div className="bg-accent-soft border border-accent/30 rounded-lg px-4 py-3 mt-4 max-w-2xl">
          <p className="text-sm text-primary-dark">
            Only the <strong>School Admin</strong> or <strong>Principal</strong> can change branding and theme. You can view the current settings below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6 grid grid-cols-2 gap-3 max-w-2xl">
        {msg && <p className="text-success text-sm col-span-2">{msg}</p>}
        {error && <p className="text-danger text-sm col-span-2">{error}</p>}

        <fieldset disabled={!canEdit} className="col-span-2 grid grid-cols-2 gap-3 disabled:opacity-60">
          <input placeholder="School Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />

          <div className="col-span-2">
            <label className="text-xs text-muted block mb-1">School Logo</label>
            <div className="flex items-center gap-3">
              <img
                src={form.logoUrl || DEFAULT_LOGO_URL}
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL; }}
                alt="School logo preview"
                className="w-14 h-14 rounded-full object-cover border border-black/10 bg-canvas"
              />
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Paste a logo image URL"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  className="w-full border border-black/10 rounded-md px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary/5 disabled:opacity-50"
                  >
                    <Upload size={13} />
                    {uploading ? "Uploading..." : "Or upload a file"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-1">
              No logo set yet? Drop a default image at <code className="bg-canvas px-1 rounded">public/school-logo.png</code> in the frontend project and it'll be used automatically until a school uploads its own.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primaryColor || "#1D3557"} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-9 border border-black/10 rounded-md" />
              <input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="flex-1 border border-black/10 rounded-md px-2 py-2 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondaryColor || "#C9A227"} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-9 border border-black/10 rounded-md" />
              <input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="flex-1 border border-black/10 rounded-md px-2 py-2 text-xs" />
            </div>
          </div>

          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" />
          <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" />
          <input placeholder="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" />

          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Save Settings</button>
        </fieldset>
      </form>
    </div>
  );
}
