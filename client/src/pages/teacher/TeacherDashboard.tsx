import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import { useAuthStore } from "../../store/authStore";

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const teacher = useMyTeacherRecord();

  return (
    <div className="p-8">
      <p className="section-label">Overview</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Welcome, {user?.name}</h1>
      <p className="text-muted mt-1 text-sm">Manage today's teaching work.</p>

      {teacher ? (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Employee ID</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{teacher.employeeId}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Assigned Classes</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{teacher.assignedClasses?.length || 0}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Subjects</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{teacher.subjects?.length || 0}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm mt-6">Loading your profile...</p>
      )}
    </div>
  );
}
