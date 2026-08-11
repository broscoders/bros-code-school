import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useChildStore } from "../../store/childStore";
import ChildSwitcher from "../../components/ChildSwitcher";

export default function ParentDashboard() {
  const user = useAuthStore((s) => s.user);
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChildId } = useChildStore();
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/people/parents?schoolId=${user?.schoolId}`).then((res) => {
      const me = res.data.find((p: any) => p.userId?._id === user?.id || p.userId === user?.id);
      setChildren(me?.children || []);
    });
  }, [user]);

  useEffect(() => {
    if (selectedChildId) {
      api.get(`/ops/attendance?studentId=${selectedChildId}`).then((res) => setAttendance(res.data));
    }
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c._id === selectedChildId);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Overview</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Good day, {user?.name}</h1>
      <p className="text-muted mt-1 text-sm">Here's how your children are doing.</p>

      <div className="mt-6">
        <ChildSwitcher children={children} />
      </div>

      {selectedChild ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Recent Attendance</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">
              {attendance.length > 0 ? attendance[attendance.length - 1].status : "No data"}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Class</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{selectedChild.classId?.name || "-"}</p>
          </div>
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-5">
            <p className="text-xs text-muted">Admission #</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{selectedChild.admissionNumber}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm">No children linked to this account yet.</p>
      )}
    </div>
  );
}
