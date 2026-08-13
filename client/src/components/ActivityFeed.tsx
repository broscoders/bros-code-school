import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Activity } from "lucide-react";

export default function ActivityFeed() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) api.get(`/dashboard/activity?schoolId=${schoolId}`).then((res) => setLogs(res.data));
  }, [schoolId]);

  return (
    <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
      <h2 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        Recent Activity
      </h2>
      {logs.length === 0 ? (
        <p className="text-sm text-muted">No recent activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l._id} className="text-sm text-ink border-b border-black/5 pb-2 last:border-0">
              <span className="font-medium">{l.userName}</span> <span className="text-muted">{l.action.toLowerCase()}</span>
              <p className="text-[11px] text-muted mt-0.5">{new Date(l.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
