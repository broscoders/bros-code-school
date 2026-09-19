import { useState } from "react";
import { UserCircle, X } from "lucide-react";
import api from "../services/api";

// Blueprint 23/70: the four creation forms (Students/Teachers/Parents/HR)
// now collect a phone number for new accounts, but every account created
// before this change - which is most of them in any real school - has
// none. This lets anyone add or fix their own, without needing an admin
// to edit it for them.
export default function MyProfileButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const openModal = async () => {
    setOpen(true);
    setSaved(false);
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setPhone(res.data.phone || "");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      await api.put("/auth/me", { phone });
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-white/5 hover:text-ink w-full"
      >
        <UserCircle size={17} />
        My Profile
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface rounded-xl border border-border shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <UserCircle size={18} className="text-primary" />My Profile
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="text-sm text-muted text-center py-4">Loading...</p>
              ) : (
                <>
                  <label className="block text-xs font-medium text-muted mb-1.5">Phone number</label>
                  <p className="text-xs text-muted mb-2">Used for SMS/WhatsApp alerts, where enabled by your school.</p>
                  {error && <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-xs">{error}</div>}
                  <input
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
                    placeholder="03001234567"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
                  />
                  <button onClick={save} disabled={saving} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60">
                    {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
