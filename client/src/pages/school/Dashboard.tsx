import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
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

const FEE_COLORS = { Collected: "#22c55e", Pending: "#f59e0b", Overdue: "#ef4444" } as const;

type Summary = {
  counts: { students: number; teachers: number; pendingAdmissions: number; announcements: number };
  admissionFunnel: { stage: string; count: number }[];
  enrollmentTrend: { month: string; students: number }[];
  fees: { collected: number; pending: number; overdue: number } | null;
  upcoming: { id: string; title: string; date: string; type: string }[];
  activity: any[];
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // One request (counts/aggregates computed by the database) instead of six
  // requests that downloaded every student, teacher and admission record.
  useEffect(() => {
    let cancelled = false;
    api
      .get("/dashboard/summary")
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const counts = data?.counts || { students: 0, teachers: 0, pendingAdmissions: 0, announcements: 0 };
  const enrollmentTrend = data?.enrollmentTrend || [];
  const admissionFunnel = data?.admissionFunnel || [];
  const events = data?.upcoming || [];
  const activity = data?.activity || [];
  const feeTotal = data?.fees ? data.fees.collected + data.fees.pending + data.fees.overdue : 0;
  const feeBreakdown = data?.fees && feeTotal > 0
    ? [
        { name: "Collected", value: Math.round((data.fees.collected / feeTotal) * 100), color: FEE_COLORS.Collected },
        { name: "Pending", value: Math.round((data.fees.pending / feeTotal) * 100), color: FEE_COLORS.Pending },
        { name: "Overdue", value: Math.round((data.fees.overdue / feeTotal) * 100), color: FEE_COLORS.Overdue },
      ]
    : [];

  const maxFunnel = Math.max(1, ...admissionFunnel.map((f) => f.count));
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="section-label mb-1.5">{dateLabel}</p>
          <h1 className="font-display text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
          <p className="text-muted mt-1 text-sm">Here is what is happening in your school today.</p>
        </div>
      </div>

      {failed && <p className="text-danger text-sm mt-4">Dashboard numbers could not be loaded. Please refresh the page.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Students" value={loading ? "..." : counts.students} icon={Users} tone="primary" />
        <StatCard label="Total Teachers" value={loading ? "..." : counts.teachers} icon={GraduationCap} tone="teal" />
        <StatCard label="Pending Admissions" value={loading ? "..." : counts.pendingAdmissions} icon={ClipboardList} tone="accent" />
        <StatCard label="Announcements" value={loading ? "..." : counts.announcements} icon={Bell} tone="steel" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="font-display font-semibold text-ink flex items-center gap-2 text-sm">
              <TrendingUp size={15} className="text-primary" />
              Student Enrollment Trend
            </h2>
            <span className="text-[11px] text-muted">Last 6 months</span>
          </div>
          <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "#141830", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#f3f5f9" }}
              />
              <Line type="monotone" dataKey="students" stroke="#4f8cff" strokeWidth={2.5} dot={{ r: 3, fill: "#4f8cff" }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="font-display font-semibold text-ink text-sm">Fee Collection</h2>
          </div>
          <div className="p-5">
            {!data?.fees ? (
              <p className="text-sm text-muted">Fee figures are visible to the Head and Accountant.</p>
            ) : feeBreakdown.length === 0 ? (
              <p className="text-sm text-muted">No invoices yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={feeBreakdown} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={3}>
                      {feeBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#141830", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
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
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="font-display font-semibold text-ink text-sm">Admission Funnel</h2>
          </div>
          <div className="p-5 space-y-2.5">
            {admissionFunnel.every((f) => f.count === 0) && <p className="text-sm text-muted">No admission applications yet.</p>}
            {admissionFunnel.map((f) => (
              <div key={f.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-soft">{f.stage}</span>
                  <span className="text-ink font-medium">{f.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
              <CalendarClock size={15} className="text-primary" />
              Upcoming Events
            </h2>
          </div>
          <div className="p-5">
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
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
              <Activity size={15} className="text-primary" />
              Recent Activity
            </h2>
          </div>
          <div className="p-5">
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
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden mt-6">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="font-display font-semibold text-ink text-sm">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          <button onClick={() => navigate("/students")} className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors"><UserPlus size={16} /> Add Student</button>
          <button onClick={() => navigate("/admissions")} className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors"><ClipboardList size={16} /> New Admission</button>
          <button onClick={() => navigate("/attendance")} className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors"><ClipboardCheck size={16} /> View Attendance</button>
          <button onClick={() => navigate("/announcements")} className="flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-border rounded-lg py-2.5 text-sm text-ink-soft transition-colors"><CheckSquare size={16} /> Create Notice</button>
        </div>
      </div>
    </div>
  );
}