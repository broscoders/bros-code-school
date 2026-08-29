import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import { Users } from "lucide-react";

export default function TeacherClasses() {
  const teacher = useMyTeacherRecord();

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Teaching</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Users size={22} className="text-primary" />My Classes</h1>
        <p className="text-muted mt-1 text-sm">Classes and subjects assigned to you.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">Assigned Classes</h2>
        <ul className="text-sm divide-y divide-black/5">
          {(!teacher?.assignedClasses || teacher.assignedClasses.length === 0) && <li className="py-2 text-muted">No classes assigned yet.</li>}
          {teacher?.assignedClasses?.map((c: any) => (
            <li key={c._id} className="py-2">{c.name}</li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
        <h2 className="font-display font-semibold text-primary-dark mb-3">Subjects</h2>
        <ul className="text-sm divide-y divide-black/5">
          {(!teacher?.subjects || teacher.subjects.length === 0) && <li className="py-2 text-muted">No subjects assigned yet.</li>}
          {teacher?.subjects?.map((s: any) => (
            <li key={s._id} className="py-2">{s.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
