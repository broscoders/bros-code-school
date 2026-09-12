import { useState } from "react";
import { Shield, Monitor, X } from "lucide-react";
import api from "../services/api";

interface SessionInfo {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

function describeDevice(userAgent?: string) {
  if (!userAgent) return "Unknown device";
  if (/mobile/i.test(userAgent)) return "Mobile browser";
  if (/ipad|tablet/i.test(userAgent)) return "Tablet browser";
  if (/chrome/i.test(userAgent)) return "Chrome on desktop";
  if (/firefox/i.test(userAgent)) return "Firefox on desktop";
  if (/safari/i.test(userAgent)) return "Safari on desktop";
  return "Desktop browser";
}

// Blueprint 10 (Session Management): "Users should be able to see their
// active sessions" + "Logout from other sessions". Dropped into every
// role's layout as a single self-contained trigger+modal so each one only
// needs a single line, rather than duplicating this state five times.
export default function ActiveSessionsButton() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/sessions");
      setSessions(res.data);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setOpen(true);
    load();
  };

  const revoke = async (id: string) => {
    await api.post(`/auth/sessions/${id}/revoke`);
    load();
  };

  const logoutOthers = async () => {
    if (!confirm("Log out of every other device? This one will stay signed in.")) return;
    await api.post("/auth/sessions/logout-others");
    load();
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-white/5 hover:text-ink w-full"
      >
        <Shield size={17} />
        Active Sessions
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-surface rounded-xl border border-border shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Shield size={18} className="text-primary" />Active Sessions
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-muted mb-3">
                Devices and browsers currently logged into your account. If you don't recognize one, revoke it.
              </p>

              {loading ? (
                <p className="text-sm text-muted text-center py-6">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No active sessions found.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Monitor size={16} className="text-muted shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-ink truncate">
                            {describeDevice(s.userAgent)}
                            {s.isCurrent && <span className="ml-2 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full">This device</span>}
                          </p>
                          <p className="text-xs text-muted">
                            Last active {new Date(s.lastSeenAt).toLocaleString()}{s.ip ? ` · ${s.ip}` : ""}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button onClick={() => revoke(s.id)} className="text-xs font-medium text-danger hover:text-danger/70 shrink-0 ml-2">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <div className="p-4 border-t border-border">
                <button onClick={logoutOthers} className="w-full text-sm font-medium text-danger border border-danger/30 rounded-lg py-2 hover:bg-danger/10 transition-colors">
                  Log out of all other devices
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
