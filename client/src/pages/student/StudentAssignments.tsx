import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { FileText } from "lucide-react";

export default function StudentAssignments() {
  const student = useMyStudentRecord();
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    const classId = student?.classId?._id || student?.classId;
    if (classId) api.get(`/ops/assignments?classId=${classId}`).then((res) => setList(res.data));
  }, [student]);

  return (
    <div className="p-8">
      <p className="section-label">My School Life</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><FileText size={22} className="text-primary" />Assignments</h1>
      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">No assignments yet.</p>}
        {list.map((a) => (
          <div key={a._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{a.title}</h3>
              <span className="text-xs text-muted">Due {new Date(a.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{a.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
