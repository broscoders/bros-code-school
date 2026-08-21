import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentLeave() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/comm/leave-requests?schoolId=${user.schoolId}`).then((res) =>
        setMyLeaves(res.data.filter((l: any) => l.requestedBy?._id === user.id || l.requestedBy === user.id))
      );
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/comm/leave-requests", {
      schoolId: user?.schoolId,
      requestedBy: user?.id,
      studentId: selectedChildId,
      reason,
      date,
      type: "STUDENT",
    });
    setReason("");
    setDate("");
    const res = await api.get(`/comm/leave-requests?schoolId=${user?.schoolId}`);
    setMyLeaves(res.data.filter((l: any) => l.requestedBy?._id === user?.id || l.requestedBy === user?.id));
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Requests</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Leave Request</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>

      <form onSubmit={submit} className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
        <textarea placeholder="Reason (e.g. Ahmed is sick today)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm" rows={2} required />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">Submit Request</button>
      </form>

      <div className="space-y-2 mt-6">
        {myLeaves.length === 0 && <p className="text-muted text-sm">No leave requests submitted yet.</p>}
        {myLeaves.map((l) => (
          <div key={l._id} className="bg-surface rounded-xl border border-border shadow-sm p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-primary-dark">{new Date(l.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted">{l.reason}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "APPROVED" ? "bg-success-soft text-success" : l.status === "REJECTED" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
              {l.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
