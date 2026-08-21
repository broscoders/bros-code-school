import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function LeaveRequests() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    const res = await api.get(`/comm/leave-requests?schoolId=${schoolId}`);
    setList(res.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/comm/leave-requests/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Requests</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Leave Requests</h1>
      <p className="text-muted mt-1 text-sm">Approve or reject leave requests from students and teachers.</p>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Reason</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Action</th></tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No leave requests yet.</td></tr>
            ) : (
              list.map((l) => (
                <tr key={l._id} className="border-t border-border">
                  <td className="p-3">{l.type}</td>
                  <td className="p-3">{new Date(l.date).toLocaleDateString()}</td>
                  <td className="p-3">{l.reason}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "APPROVED" ? "bg-success-soft text-success" : l.status === "REJECTED" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {l.status === "PENDING" && (
                      <>
                        <button onClick={() => updateStatus(l._id, "APPROVED")} className="text-success text-xs underline">Approve</button>
                        <button onClick={() => updateStatus(l._id, "REJECTED")} className="text-danger text-xs underline">Reject</button>
                      </>
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

