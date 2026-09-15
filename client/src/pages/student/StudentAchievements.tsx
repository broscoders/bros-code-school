import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Trophy } from "lucide-react";

const CATEGORY_STYLES: Record<string, string> = {
  ACADEMIC: "bg-accent-soft text-accent",
  SPORTS: "bg-success/10 text-success",
  COMPETITION: "bg-warning/10 text-warning",
  APPRECIATION: "bg-primary/10 text-primary",
  PARTICIPATION: "bg-canvas text-muted",
};

export default function StudentAchievements() {
  const user = useAuthStore((s) => s.user);
  const [studentId, setStudentId] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/people/students?schoolId=${user.schoolId}`).then((res) => {
        const me = res.data.find((s: any) => s.userId?._id === user.id || s.userId === user.id);
        if (me) setStudentId(me._id);
      });
    }
  }, [user]);

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      api.get(`/achievements?studentId=${studentId}`).then((res) => setList(res.data)).finally(() => setLoading(false));
    }
  }, [studentId]);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">My Profile</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Trophy size={22} className="text-primary" />My Achievements
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : list.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No achievements recorded yet. Keep it up!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((a) => (
            <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-ink text-sm">{a.title}</h3>
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[a.category]}`}>{a.category}</span>
              </div>
              {a.description && <p className="text-sm text-muted mt-1">{a.description}</p>}
              <p className="text-[11px] text-muted mt-2">{new Date(a.dateAwarded).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
