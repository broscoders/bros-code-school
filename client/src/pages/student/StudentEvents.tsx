import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { CalendarDays } from "lucide-react";

const TYPE_STYLES: Record<string, string> = {
  HOLIDAY: "bg-success/10 text-success",
  EXAM: "bg-danger/10 text-danger",
  PTM: "bg-accent-soft text-accent",
  SPORTS: "bg-warning/10 text-warning",
  TRIP: "bg-primary/10 text-primary",
  COMPETITION: "bg-warning/10 text-warning",
  FUNCTION: "bg-primary/10 text-primary",
  WORKSHOP: "bg-accent-soft text-accent",
  ACADEMY: "bg-canvas text-muted",
};

export default function StudentEvents() {
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/events?schoolId=${user.schoolId}`).then((res) => {
        setEvents([...res.data].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      });
    }
  }, [user]);

  const upcoming = events.filter((e) => new Date(e.date) >= new Date(new Date().toDateString()));
  const past = events.filter((e) => new Date(e.date) < new Date(new Date().toDateString()));

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">School</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <CalendarDays size={22} className="text-primary" />Calendar & Events
        </h1>
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 && <p className="text-sm text-muted">No upcoming events.</p>}
        {upcoming.map((e) => (
          <div key={e._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-ink text-sm">{e.title}</h3>
              <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[e.eventType]}`}>{e.eventType}</span>
            </div>
            {e.description && <p className="text-sm text-muted mt-1">{e.description}</p>}
            <p className="text-[11px] text-muted mt-2">{new Date(e.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="text-sm text-muted cursor-pointer">Past events ({past.length})</summary>
          <div className="space-y-3 mt-3">
            {past.slice().reverse().map((e) => (
              <div key={e._id} className="bg-surface rounded-xl border border-border p-4 opacity-70">
                <h3 className="font-semibold text-ink text-sm">{e.title}</h3>
                <p className="text-[11px] text-muted mt-1">{new Date(e.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
