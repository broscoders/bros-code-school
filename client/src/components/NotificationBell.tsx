import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    if (!user?.id) return;
    const res = await api.get(`/system/notifications?userId=${user.id}`);
    setList(res.data);
  };

  useEffect(() => {
    load();
  }, [user]);

  const unread = list.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await api.put("/system/notifications/read-all", { userId: user?.id });
    load();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-canvas">
        <Bell size={18} className="text-muted" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-border z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <span className="font-display font-semibold text-sm text-ink">Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary">Mark all read</button>}
          </div>
          {list.length === 0 ? (
            <p className="p-4 text-sm text-muted">No notifications yet.</p>
          ) : (
            list.map((n) => (
              <div key={n._id} className={`p-3 border-b border-border text-sm ${!n.isRead ? "bg-primary/5" : ""}`}>
                <p className="font-medium text-ink">{n.title}</p>
                <p className="text-muted text-xs mt-0.5">{n.message}</p>
                <p className="text-muted text-[10px] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
