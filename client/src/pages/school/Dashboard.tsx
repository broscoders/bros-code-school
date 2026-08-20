import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import {
  Users, GraduationCap, ClipboardList, Bell, TrendingUp,
  CalendarClock, Activity, CheckSquare, UserPlus, ClipboardCheck,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import StatCard from "../../components/StatCard";

const enrollmentTrend = [
  { month: "Jan", students: 1120 },
  { month: "Feb", students: 1145 },
  { month: "Mar", students: 1160 },
  { month: "Apr", students: 1190 },
  { month: "May", students: 1210 },
  { month: "Jun", students: 1248 },
];

const feeBreakdown = [
  { name: "Collected", value: 65, color: "#22c55e" },
  { name: "Pending", value: 22, color: "#f59e0b" },
  { name: "Overdue", value: 13, color: "#ef4444" },
];

const admissionFunnel = [
  { stage: "Leads", count: 512 },
  { stage: "Applications", count: 256 },
  { stage: "Interviews", count: 128 },
  { stage: "Approved", count: 64 },
  { stage: "Admitted", count: 24 },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, admissions: 0, announcements: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [students, teachers, admissions, announcements, calendar, activityFeed] = await Promise.all([
          api.get("/people/students"),
          api.get("/people/teachers"),
          api.get("/admissions"),
          api.get("/announcements"),
          api.get("/dashboard/calendar"),
          api.get("/dashboard/activity"),
        ]);
        setCounts({
          students: students.data.length,
          teachers: teachers.data.length,
          admissions: admissions.data.filter((a: any) => a.status === "APPLICATION" || a.status === "REVIEW").length,
          announcements: announcements.data.length,
        });
        setEvents(calendar.data.slice(0, 4));
        setActivity(activityFeed.data.slice(0, 5));
      } catch {
        // widgets below handle their own empty states
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxFunnel = admissionFunnel[0]?.count || 1;

  return (
    <div className="p-6 lg:p-8">
      <p className="text-xs uppercase tracking-wider text-[#1e9fe0] font-semibold">Overview</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Welcome, {user?.name}</h1>
      <p className="text-muted mt-1 text-sm">Here is what is happening in your school today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Students" value={loading ? "..." : counts.students} icon={Users} tone="primary" />
        <StatCard label="Total Teachers" value={loading ? "..." : counts.teachers} icon={GraduationCap} tone="teal" />
        <StatCard label="Pending Admissions" value={loading ? "..." : counts.admissions} icon={ClipboardList} tone="accent" />
        <StatCard label="Announcements" value={loading ? "..." : counts.announcements} icon={Bell} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink flex items-center gap-2">
              <TrendingUp size={16} className="text-[#1e9fe0]" />
              Student Enrollment Trend
            </h2>
            <span className="text-[11px] text-muted">This Year</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "#141830", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#f3f5f9" }}
              />
              <Line type="monotone" dataKey="students" stroke="#1e9fe0" strokeWidth={2.5} dot={{ r: 3, fill: "#1e9fe0" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold text-ink mb-4">Fee Collection</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={feeBreakdown} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={3}>
                {feeBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#141830", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {feeBreakdown.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </span>
                <span className="text-ink font-medium">{f.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold text-ink mb-4">Admission Funnel</h2>
          <div className="space-y-2.5">
            {admissionFunnel.map((f) => (
              <div key={f.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-soft">{f.stage}</span>
                  <span className="text-ink font-medium">{f.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1e9fe0]"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-[#1e9fe0]" />
            Upcoming Events
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled right now.</p>
          ) : (
            <ul className="space-y-2.5">
              {events.map((e) => (
                <li key={e.id} className="text-sm border-b border-border pb-2 last:border-0">
                  <p className="text-ink font-medium">{e.title}</p>
                  <p className="text-[11px] text-muted mt-0.5">{new Date(e.date).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
            <Activity size={16} className="text-[#1e9fe0]" />
            Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No recent activity yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((l) => (
                <li key={l._id} className="text-sm border-b border-border pb-2 last:border-0">
                  <span className="text-ink font-medium">{l.userName}</span>{" "}
                  <span className="text-muted">{l.action?.toLowerCase()}</span>
                  <p className="text-[11px] text-muted mt-0.5">{new Date(l.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 mt-6">
        <h2 className="font-display font-semibold text-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors">
            <UserPlus size={16} /> Add Student
          </button>
          <button className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors">
            <ClipboardList size={16} /> New Admission
          </button>
          <button className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors">
            <ClipboardCheck size={16} /> Mark Attendance
          </button>
          <button className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors">
            <CheckSquare size={16} /> Create Notice
          </button>
        </div>
      </div>
    </div>
  );
}