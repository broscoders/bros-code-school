import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { UserCheck } from "lucide-react";

export default function Visitors() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", purpose: "", personToMeet: "" });

  const load = async () => {
    const res = await api.get(`/health/visitors?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/health/visitors", { ...form, schoolId });
    setForm({ name: "", contact: "", purpose: "", personToMeet: "" });
    load();
  };

  const checkout = async (id: string) => {
    await api.put(`/health/visitors/${id}/checkout`, {});
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Front Desk</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><UserCheck size={22} className="text-primary" />Visitor Management</h1>
      <p className="text-muted mt-1 text-sm">Register and track visitors entering the school.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <input placeholder="Visitor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" required />
        <input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" required />
        <input placeholder="Purpose of Visit" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" required />
        <input placeholder="Person to Meet" value={form.personToMeet} onChange={(e) => setForm({ ...form, personToMeet: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" required />
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">+ Check In Visitor</button>
      </form>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Purpose</th>
              <th className="p-3 font-medium">Meeting</th>
              <th className="p-3 font-medium">Check In</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No visitors logged yet.</td></tr>
            ) : (
              list.map((v) => (
                <tr key={v._id} className="border-t border-border">
                  <td className="p-3">{v.name}</td>
                  <td className="p-3">{v.purpose}</td>
                  <td className="p-3">{v.personToMeet}</td>
                  <td className="p-3 text-xs text-muted">{new Date(v.checkInTime).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.status === "CHECKED_IN" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{v.status}</span>
                  </td>
                  <td className="p-3">
                    {v.status === "CHECKED_IN" && <button onClick={() => checkout(v._id)} className="text-primary text-xs underline">Check Out</button>}
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

