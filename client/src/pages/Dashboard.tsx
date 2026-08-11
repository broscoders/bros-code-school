import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { Users, GraduationCap, ClipboardList, Bell } from "lucide-react";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId;
  const [counts, setCounts] = useState({ students: 0, teachers: 0, admissions: 0, announcements: 0 });

  useEffect(() => {
    if (!schoolId) return;
    const load = async () => {
      const [students, teachers, admissions, announcements] = await Promise.all([
        api.get(`/people/students?schoolId=${schoolId}`),
        api.get(`/people/teachers?schoolId=${schoolId}`),
        api.get(`/extra/admissions?schoolId=${schoolId}`),
        api.get(`/extra/announcements?schoolId=${schoolId}`),
      ]);
      setCounts({
        students: students.data.length,
        teachers: teachers.data.length,
        admissions: admissions.data.filter((a: any) => a.status === "APPLICATION" || a.status === "REVIEW").length,
        announcements: announcements.data.length,
      });
    };
    load();
  }, [schoolId]);

  const stats = [
    { label: "Total Students", value: counts.students, icon: Users },
    { label: "Total Teachers", value: counts.teachers, icon: GraduationCap },
    { label: "Pending Admissions", value: counts.admissions, icon: ClipboardList },
    { label: "Announcements", value: counts.announcements, icon: Bell },
  ];

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Overview</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Welcome, {user?.name}</h1>
      <p className="text-muted mt-1 text-sm">Here is what is happening in your school today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="text-xl font-display font-bold text-primary-dark">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-1">Needs Attention</h2>
        <p className="text-sm text-muted">
          {counts.admissions > 0 ? `${counts.admissions} admission applications waiting.` : "No pending items right now."}
        </p>
      </div>
    </div>
  );
}
