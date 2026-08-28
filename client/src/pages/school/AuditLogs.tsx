import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ShieldCheck } from "lucide-react";

export default function AuditLogs() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) api.get(`/audit?schoolId=${schoolId}`).then((res) => setLogs(res.data));
  }, [schoolId]);

  return (
    <div className="p-8">
      <p className="section-label">Security</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><ShieldCheck size={22} className="text-primary" />Audit Logs</h1>
      <p className="text-muted mt-1 text-sm">Track important actions across the system.</p>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Record</th>
              <th className="p-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No logged actions yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t border-border">
                  <td className="p-3">{log.userName} <span className="text-muted text-xs">({log.userRole})</span></td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3 text-muted text-xs">{log.recordType}</td>
                  <td className="p-3 text-muted text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

