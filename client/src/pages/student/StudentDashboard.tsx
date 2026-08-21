import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { useAuthStore } from "../../store/authStore";

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const student = useMyStudentRecord();

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Overview</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Hey, {user?.name}</h1>
      <p className="text-muted mt-1 text-sm">Here is your school life at a glance.</p>

      {student ? (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Class</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{student.classId?.name || "-"}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Section</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{student.sectionId?.name || "-"}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-muted">Admission #</p>
            <p className="text-xl font-display font-bold text-primary-dark mt-1">{student.admissionNumber}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm mt-6">Loading your profile...</p>
      )}
    </div>
  );
}
