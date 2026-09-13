import { useEffect, useState } from "react";
import api from "../../services/api";
import { Mail, CheckCircle2, XCircle } from "lucide-react";

export default function CommunicationLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/system/communication-log").then((res) => setLogs(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Administration</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Mail size={22} className="text-primary" />Communication Log
        </h1>
        <p className="text-muted mt-1 text-sm">Every email the system has tried to send, and whether it actually went out. Last 200 shown.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No emails sent yet.
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-ink text-left">
              <tr>
                <th className="p-3 font-medium">To</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t border-border">
                  <td className="p-3 text-muted">{l.to}</td>
                  <td className="p-3 text-ink">{l.subject}</td>
                  <td className="p-3">
                    {l.status === "SENT" ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle2 size={12} />Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded-full w-fit" title={l.error}>
                        <XCircle size={12} />Failed
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
