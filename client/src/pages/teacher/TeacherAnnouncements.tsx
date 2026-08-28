import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Megaphone } from "lucide-react";

export default function TeacherAnnouncements() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (schoolId) api.get(`/announcements?schoolId=${schoolId}`).then((res) => setList(res.data));
  }, [schoolId]);

  return (
    <div className="p-8">
      <p className="section-label">Communication</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Megaphone size={22} className="text-primary" />Announcements</h1>
      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">No announcements yet.</p>}
        {list.map((a) => (
          <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <h3 className="font-display font-semibold text-primary-dark">{a.title}</h3>
            <p className="text-sm text-muted mt-1">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

