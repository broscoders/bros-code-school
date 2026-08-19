import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const typeColors: Record<string, string> = {
  EXAM: "bg-red-50 text-red-600",
  PTM: "bg-violet-50 text-violet-600",
  HOLIDAY: "bg-emerald-50 text-emerald-600",
  SPORTS: "bg-amber-50 text-amber-600",
  TRIP: "bg-blue-50 text-blue-600",
  FUNCTION: "bg-pink-50 text-pink-600",
};

export default function CalendarPage() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) api.get(`/dashboard/calendar?schoolId=${schoolId}`).then((res) => setItems(res.data));
  }, [schoolId]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Planning</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Unified Calendar</h1>
      <p className="text-muted mt-1 text-sm">All exams, events and meetings in one timeline.</p>

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 mt-6">
        {items.length === 0 ? (
          <p className="text-muted text-sm">No upcoming items.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-black/5 pb-3 last:border-0">
                <div className="w-14 text-center">
                  <p className="text-xs text-muted">{new Date(item.date).toLocaleDateString(undefined, { month: "short" })}</p>
                  <p className="font-display font-bold text-ink">{new Date(item.date).getDate()}</p>
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${typeColors[item.type] || "bg-slate-50 text-slate-600"}`}>{item.type}</span>
                <p className="text-sm text-ink flex-1">{item.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

