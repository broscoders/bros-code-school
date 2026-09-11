import { useEffect, useState } from "react";
import api from "../../services/api";
import { BadgeCheck, Send, RotateCcw, Ban, Clock } from "lucide-react";

const ROLES = [
  "PRINCIPAL", "HEAD", "ADMISSION_STAFF", "ACADEMIC_COORDINATOR", "ACCOUNTANT",
  "RECEPTIONIST", "LIBRARIAN", "TRANSPORT_MANAGER", "NURSE", "HOSTEL_WARDEN",
  "TEACHER", "ACADEMY_TEACHER", "PARENT", "STUDENT",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  ACCEPTED: "bg-success/10 text-success",
  EXPIRED: "bg-muted/10 text-muted",
  REVOKED: "bg-danger/10 text-danger",
};

export default function Invitations() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("ANY");

  const load = async (status = filter) => {
    const res = await api.get(`/invitations${status !== "ANY" ? `?status=${status}` : ""}`);
    setInvitations(res.data);
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.post("/invitations", { name, email, role });
      setName("");
      setEmail("");
      load(filter);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not send invitation");
    } finally {
      setSending(false);
    }
  };

  const resend = async (id: string) => {
    await api.post(`/invitations/${id}/resend`);
    load(filter);
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this invitation? The link will stop working.")) return;
    await api.post(`/invitations/${id}/revoke`);
    load(filter);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Access Control</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <BadgeCheck size={22} className="text-primary" />Invitations
        </h1>
        <p className="text-muted mt-1 text-sm">Invite teachers, staff, or parents by email. They set their own password when they accept.</p>
      </div>

      <form onSubmit={sendInvite} className="bg-surface rounded-xl border border-border shadow-sm p-5 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-muted mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="name@example.com" />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-muted mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <button type="submit" disabled={sending} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-60">
          <Send size={14} />{sending ? "Sending..." : "Send Invite"}
        </button>
      </form>

      {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-sm">{error}</div>}

      <div className="flex gap-2 mb-4">
        {["ANY", "PENDING", "ACCEPTED", "EXPIRED", "REVOKED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-primary text-white" : "bg-canvas text-muted hover:text-ink"}`}
          >
            {s === "ANY" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Expires</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv._id} className="border-t border-border">
                <td className="p-3">{inv.name}</td>
                <td className="p-3 text-muted">{inv.email}</td>
                <td className="p-3">{inv.role.replace(/_/g, " ")}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[inv.status] || ""}`}>{inv.status}</span>
                </td>
                <td className="p-3 text-muted flex items-center gap-1">
                  <Clock size={12} />{new Date(inv.expiresAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  {(inv.status === "PENDING" || inv.status === "EXPIRED") && (
                    <button onClick={() => resend(inv._id)} title="Resend" className="text-primary hover:text-primary-dark mr-3 inline-flex items-center gap-1">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {inv.status === "PENDING" && (
                    <button onClick={() => revoke(inv._id)} title="Revoke" className="text-danger hover:text-danger/70 inline-flex items-center gap-1">
                      <Ban size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invitations.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No invitations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
