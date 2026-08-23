import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { CalendarCheck } from "lucide-react";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentAttendance() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    if (selectedChildId) api.get(`/ops/attendance?studentId=${selectedChildId}`).then((res) => setRecords(res.data));
  }, [selectedChildId]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Monitoring</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><CalendarCheck size={22} className="text-primary" />Attendance</h1>
      <div className="mt-6"><ChildSwitcher children={children} /></div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-primary-dark text-left">
            <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={2} className="p-6 text-center text-muted">No attendance records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} className="border-t border-border">
                  <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
